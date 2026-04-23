import { Server as WebSocketServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { auth } from "@/lib/better-auth";
import { APP_URL } from "@/config/app.config";
import { fromNodeHeaders } from "better-auth/node";

export class SocketService {
  private io: WebSocketServer;

  constructor(server: HttpServer) {
    this.io = new WebSocketServer(server, {
      cors: {
        origin: APP_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventListeners();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        // Better-Auth session verification via handshake headers
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(socket.handshake.headers),
        });

        if (!session) {
          return next(new Error("Authentication failed"));
        }

        // Attach user info to socket data
        socket.data.user = session.user;
        next();
      } catch (error) {
        next(new Error("Internal Server Error"));
      }
    });
  }

  private setupEventListeners(): void {
    this.io.on("connection", (socket: Socket) => {
      const user = socket.data.user;
      console.log(`Connected: ${user.name} (${socket.id})`);

      socket.on("join_room", (room: string) => {
        socket.join(room);
      });

      socket.on("send_message", async (data) => {
        // Broadcast with user data from the verified session
        this.io.to(data.room).emit("receive_message", {
          ...data,
          author: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          timestamp: new Date().toISOString(),
        });
      });

      socket.on("disconnect", () => {
        console.log(`Disconnected: ${user.name}`);
      });
    });
  }
}
