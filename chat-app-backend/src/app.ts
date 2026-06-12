import express, { type Application } from "express";
import { createServer, type Server as HttpServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { Controller } from "@/interfaces/controller.interface";
import { ALLOWED_ORIGINS } from "@/config/cors-origins";

import { connectRedis } from "@/lib/redis";
import { EventEmitter } from "events";

import { container } from "@/config/inversify.config";
import { TYPES } from "@/config/types";
import { SocketServerProvider } from "@/web-socket/socket-server.provider";
import { WebSocketService } from "@/web-socket/web-socket.service";

import { NotificationSubscriber } from "@/web-socket/handlers/notification.subscriber";
import { errorMiddleware } from "@/middlewares/error.middleware";

export class App {
  public express: Application;
  public port: number;
  public server: HttpServer;

  constructor(controllers: Controller[], port: number) {
    this.express = express();
    this.port = port;
    this.server = createServer(this.express);

    this.initializeMiddlewares();
    this.initializeControllers(controllers);

    // Error middleware MUST be loaded LAST in the express chain to capture bubble-ups
    this.express.use(errorMiddleware);

    // Establish Redis connection before starting the WebSocket server
    void connectRedis();

    // Register WebSocket event handlers before starting the WebSocket server
    this.initializeEventSubscribers();

    // Initialize and start the WebSocket server
    // Fetch the provider and pass the server instance to it
    const serverProvider = container.get<SocketServerProvider>(TYPES.SocketServerProvider);
    serverProvider.create(this.server);

    // Resolve and start the WebSocket service wrapper cleanly
    const webSocketService = container.get<WebSocketService>(TYPES.WebSocketService);
    webSocketService.start();
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Server running on port ${String(this.port)}`);
    });
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

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller: Controller) => {
      this.express.use("/api", controller.router);
    });
  }

  private initializeEventSubscribers(): void {
    // Extract the dispatcher instance and subscriber class from the DI environment
    const dispatcher = container.get<EventEmitter>(TYPES.EventDispatcher);
    const notificationSubscriber = container.get<NotificationSubscriber>(TYPES.NotificationSubscriber);

    // Register the handler using injectable class context instance
    dispatcher.on("notification:created", notificationSubscriber.handleNotificationCreated);

    console.log("🔔 [App] Successfully registered domain event subscribers");
  }
}
