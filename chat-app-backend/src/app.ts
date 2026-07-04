import express, { type Application } from "express";
import { createServer, type Server as HttpServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import swaggerUi from "swagger-ui-express";
import { swaggerSpecs } from "@/config/swagger";

import { HttpRouter } from "@/interfaces/router.interface";
import { ALLOWED_ORIGINS } from "@/config/cors-origins";

import { connectRedis, redisClient, pubClient, subClient } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { createHealthRouter } from "@/lib/health";
import { EventEmitter } from "events";

import { container } from "@/config/inversify.config";
import { TYPES } from "@/config/types";

import { errorMiddleware } from "@/middlewares/error.middleware";

import { SocketServerProvider } from "@/web-socket/socket-server.provider";
import { WebSocketServer } from "@/web-socket/web-socket.server";
import type { Server as SocketServer } from "socket.io";

import { NotificationSubscriber } from "@/subscribers/notification.subscriber";
import { RequestSubscriber } from "@/subscribers/request.subscriber";

// How long to wait for in-flight work to drain before forcing exit.
const SHUTDOWN_TIMEOUT_MS = 10_000;

export class App {
  public express: Application;
  public port: number;
  public server: HttpServer;

  private io: SocketServer | null = null;
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

    // 3. Wire domain-event subscribers.
    this.initializeEventSubscribers();

    // 4. Start listening.
    await new Promise<void>((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🚀 Server running on port ${String(this.port)}`);
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
    console.log(`🛑 [${signal}] Graceful shutdown initiated`);

    // Force-exit if draining hangs, so we never block a deploy indefinitely.
    const forceExit = setTimeout(() => {
      console.error("⏱️  Shutdown timed out — forcing exit");
      // eslint-disable-next-line n/no-process-exit -- intentional at process boundary
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
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
      console.log("✅ Shutdown complete");
      // eslint-disable-next-line n/no-process-exit -- intentional at process boundary
      process.exit(0);
    } catch (error) {
      console.error("💥 Error during shutdown:", error);
      // eslint-disable-next-line n/no-process-exit -- intentional at process boundary
      process.exit(1);
    }
  }

  private initializeMiddlewares(): void {
    this.express.use(express.json({ limit: "10mb" }));
    this.express.use(helmet());
    this.express.use(
      cors({
        origin: ALLOWED_ORIGINS,
        credentials: true,
      }),
    );
    this.express.use(morgan("dev"));
    this.express.use(compression());
  }

  private initializeHealthChecks(): void {
    // Root-level (unprefixed, unauthenticated) so probes are stable + cheap.
    this.express.use(createHealthRouter(() => this.isShuttingDown));
  }

  private initializeRouters(routers: HttpRouter[]): void {
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

  private initializeEventSubscribers(): void {
    const dispatcher = container.get<EventEmitter>(TYPES.EventDispatcher);
    const notificationSubscriber = container.get<NotificationSubscriber>(TYPES.NotificationSubscriber);
    const requestSubscriber = container.get<RequestSubscriber>(TYPES.RequestSubscriber);

    dispatcher.on("notification:new", notificationSubscriber.handleNotificationCreated);
    dispatcher.on("request:new", requestSubscriber.handleRequestSent);
    dispatcher.on("request:accepted", requestSubscriber.handleRequestAccepted);
    dispatcher.on("request:canceled", requestSubscriber.handleRequestCanceled);
    dispatcher.on("request:declined", requestSubscriber.handleRequestDeclined);

    console.log("🔔 [App] Successfully registered domain event subscribers");
  }
}
