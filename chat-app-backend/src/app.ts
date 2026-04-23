import express, { type Application } from "express";
import { createServer, type Server as HttpServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { Controller } from "@/interfaces/controller.interface";
import { ALLOWED_ORIGINS } from "@/config/cors-origins";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/better-auth";
import { SocketService } from "@/services/socket.service";

export class App {
  public express: Application;
  public port: number;
  public server: HttpServer;
  private socketService: SocketService;

  constructor(controllers: Controller[], port: number) {
    this.express = express();
    this.port = port;
    this.server = createServer(this.express);

    this.initializeMiddlewares();
    this.initializeAuth();
    this.initializeControllers(controllers);

    this.socketService = new SocketService(this.server);
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  private initializeMiddlewares(): void {
    this.express.use(helmet());
    this.express.use(
      cors({
        origin: ALLOWED_ORIGINS,
        credentials: true,
      }),
    );
    this.express.use(morgan("dev"));
    this.express.use(express.json({ limit: "10mb" }));
    this.express.use(compression());
  }

  private initializeAuth(): void {
    this.express.all("/api/auth/*splat", toNodeHandler(auth)); // Better-auth route for authentication
  }

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller: Controller) => {
      this.express.use("/api", controller.router);
    });
  }
}
