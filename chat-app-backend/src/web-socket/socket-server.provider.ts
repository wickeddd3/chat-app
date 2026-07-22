import { injectable } from "inversify";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "@/lib/redis";
import { APP_URL } from "@/config/app.config";
import { socketAuthMiddleware } from "@/middlewares/socket-auth.middleware";
import { createLogger } from "@/lib/logger";
import type { Server as HttpServer } from "http";

const log = createLogger("SocketServer");

@injectable()
export class SocketServerProvider {
  private instance: SocketServer | null = null;

  public create(httpServer: HttpServer): SocketServer {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new SocketServer(httpServer, {
      cors: {
        origin: APP_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
      adapter: createAdapter(pubClient, subClient, { key: "socket.io" }),
    });

    this.instance.use(socketAuthMiddleware);

    log.info("⚡ Socket.io engine ready");
    return this.instance;
  }

  /**
   * Allows internal services to safely fetch the active running instance later
   */
  public getInstance(): SocketServer {
    if (!this.instance) {
      throw new Error("SocketServer has not been initialized yet. Call .create(server) first.");
    }
    return this.instance;
  }
}
