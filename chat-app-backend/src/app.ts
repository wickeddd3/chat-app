import express, { type Application } from "express";
import { createServer, type Server as HttpServer } from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import compression from "compression";

import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "@/config/swagger";

import { HttpRouter } from "@/interfaces/router.interface";
import { ALLOWED_ORIGINS } from "@/config/cors-origins";

import { connectRedis, redisClient, pubClient, subClient } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { createHealthRouter } from "@/lib/health";
import { logger, createLogger } from "@/lib/logger";
import { EventEmitter } from "events";

import { container } from "@/config/inversify.config";
import { TYPES } from "@/config/types";

import { errorMiddleware } from "@/middlewares/error.middleware";

import { SocketServerProvider } from "@/web-socket/socket-server.provider";
import { WebSocketServer } from "@/web-socket/web-socket.server";
import { PresencePruneWorker } from "@/services/presence-prune.worker";
import type { Server as SocketServer } from "socket.io";

import { NotificationSubscriber } from "@/subscribers/notification.subscriber";
import { RequestSubscriber } from "@/subscribers/request.subscriber";

// How long to wait for in-flight work to drain before forcing exit.
const SHUTDOWN_TIMEOUT_MS = 10_000;

const log = createLogger("App");

export class App {
  public express: Application;
  public port: number;
  public server: HttpServer;

  private io: SocketServer | null = null;
  private presencePruneWorker: PresencePruneWorker | null = null;
  private isShuttingDown = false;

  constructor(routers: HttpRouter[], port: number) {
    this.express = express();
    this.port = port;
    this.server = createServer(this.express);

    // Construction is side-effect free (no I/O); everything async happens in
    // start(). This keeps the app importable/testable and lets start() control
    // ordering (connect infra before serving traffic).
    this.initializeMiddlewares();
    this.initializeHealthChecks();
    this.initializeRouters(routers);
    this.initializeSwagger();

    // Error middleware MUST be registered LAST so it can capture bubble-ups.
    this.express.use(errorMiddleware);
  }

  /**
   * Boots infrastructure in order, then begins accepting traffic.
   */
  public async start(): Promise<void> {
    // 1. Connect Redis before anything that depends on it (websocket adapter).
    await connectRedis();

    // 2. Bring up the realtime layer.
    this.initializeWebSocket();

    // 3. Start the in-process presence prune sweep (single-instance / free tier;
    //    swap for the dedicated cron job when scaling to multiple instances).
    this.initializePresenceWorker();

    // 4. Wire domain-event subscribers.
    this.initializeEventSubscribers();

    // 5. Start listening.
    await new Promise<void>((resolve) => {
      this.server.listen(this.port, () => {
        log.info(`🚀 Server listening on port ${String(this.port)}`);
        resolve();
      });
    });
  }

  /**
   * Graceful shutdown: stop taking traffic, drain sockets, close infra.
   * Idempotent — safe to call once per signal.
   */
  public async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    log.info({ signal }, "🛑 Graceful shutdown initiated");

    // Force-exit if draining hangs, so we never block a deploy indefinitely.
    const forceExit = setTimeout(() => {
      log.error("⏱️  Shutdown timed out — forcing exit");
      // eslint-disable-next-line n/no-process-exit -- intentional at process boundary
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      // Stop the background presence sweep before tearing down infra it uses.
      this.presencePruneWorker?.stop();

      // Disconnect websocket clients (frees keep-alive conns holding the server).
      if (this.io) {
        this.io.disconnectSockets(true);
      }

      // Stop accepting new HTTP connections and wait for in-flight to finish.
      await new Promise<void>((resolve, reject) => {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Close infrastructure connections.
      await Promise.allSettled([redisClient.quit(), pubClient.quit(), subClient.quit(), prisma.$disconnect()]);

      clearTimeout(forceExit);
      log.info("✅ Shutdown complete");
      // eslint-disable-next-line n/no-process-exit -- intentional at process boundary
      process.exit(0);
    } catch (error) {
      log.error({ err: error }, "💥 Error during shutdown");
      // eslint-disable-next-line n/no-process-exit -- intentional at process boundary
      process.exit(1);
    }
  }

  private initializeMiddlewares(): void {
    // Behind Render's proxy — trust the first hop so req.ip (and the rate
    // limiter's per-client keying) reflect the real client, not the proxy.
    this.express.set("trust proxy", 1);
    this.express.use(express.json({ limit: "10mb" }));
    this.express.use(helmet());
    this.express.use(
      cors({
        origin: ALLOWED_ORIGINS,
        credentials: true,
      }),
    );
    // Structured per-request logging with a generated request id (available as
    // req.log). Health probes are noisy and uninteresting, so skip them.
    this.express.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === "/health" || req.url === "/ready",
        },
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return "error";
          if (res.statusCode >= 400) return "warn";
          return "info";
        },
        // Collapse each request into one readable line: "GET /api/users 200 (45ms)".
        // The full req/res objects stay in the structured payload (shipped as JSON
        // in prod); dev's pino-pretty hides them so the message is all you see.
        customSuccessMessage: (req, res, responseTime) =>
          `${req.method} ${req.url} ${String(res.statusCode)} (${String(responseTime)}ms)`,
        customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${String(res.statusCode)} — ${err.message}`,
      }),
    );
    this.express.use(compression());
  }

  private initializeHealthChecks(): void {
    // Root-level (unprefixed, unauthenticated) so probes are stable + cheap.
    this.express.use(createHealthRouter(() => this.isShuttingDown));
  }

  private initializeRouters(routers: HttpRouter[]): void {
    // Per-client rate limit on the API surface (health probes are mounted
    // separately and stay unthrottled). Caps abuse/DoS bursts.
    const apiLimiter = rateLimit({
      windowMs: 60_000,
      limit: 120, // requests per IP per minute
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { success: false, message: "Too many requests, please try again later." },
    });
    this.express.use("/api", apiLimiter);

    routers.forEach((routerItem: HttpRouter) => {
      this.express.use("/api", routerItem.router);
    });
  }

  private initializeSwagger(): void {
    this.express.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpecs, {
        swaggerOptions: {
          filter: true,
        },
      }),
    );
  }

  private initializeWebSocket(): void {
    const serverProvider = container.get<SocketServerProvider>(TYPES.SocketServerProvider);
    this.io = serverProvider.create(this.server);

    const webSocketServer = container.get<WebSocketServer>(TYPES.WebSocketServer);
    webSocketServer.start();
  }

  private initializePresenceWorker(): void {
    this.presencePruneWorker = container.get<PresencePruneWorker>(TYPES.PresencePruneWorker);
    this.presencePruneWorker.start();
  }

  private initializeEventSubscribers(): void {
    const dispatcher = container.get<EventEmitter>(TYPES.EventDispatcher);
    const notificationSubscriber = container.get<NotificationSubscriber>(TYPES.NotificationSubscriber);
    const requestSubscriber = container.get<RequestSubscriber>(TYPES.RequestSubscriber);

    dispatcher.on("notification:new", notificationSubscriber.handleNotificationCreated);
    dispatcher.on("request:new", requestSubscriber.handleRequestSent);
    dispatcher.on("request:accepted", requestSubscriber.handleRequestAccepted);
    dispatcher.on("request:canceled", requestSubscriber.handleRequestCanceled);
    dispatcher.on("request:declined", requestSubscriber.handleRequestDeclined);
    dispatcher.on("contact:removed", requestSubscriber.handleContactRemoved);

    log.info(`🔔 Registered ${String(dispatcher.eventNames().length)} domain event subscribers`);
  }
}
