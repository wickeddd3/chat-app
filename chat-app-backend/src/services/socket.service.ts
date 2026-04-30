import { Server as SocketServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { APP_URL } from "@/config/app.config";
import { socketAuthMiddleware } from "@/middlewares/socket-auth.middleware";
import { SendMessageEvent } from "./send-message.event";
import type { Event } from "@/interfaces/event.interface";

export class SocketService {
  private webSocketServer: SocketServer;
  private sendMessageEvent!: Event;

  constructor(server: HttpServer) {
    this.webSocketServer = new SocketServer(server, {
      cors: {
        origin: APP_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.initializeMiddleware();
    this.initializeEvents();
    this.initializeEventListeners();
  }

  private initializeMiddleware(): void {
    this.webSocketServer.use(socketAuthMiddleware);
  }

  private initializeEvents(): void {
    this.sendMessageEvent = new SendMessageEvent(this.webSocketServer);
  }

  private initializeEventListeners(): void {
    this.webSocketServer.on("connection", (socket: Socket) => {
      const user = socket.data.user;
      console.log(`Connected: ${user.name} (${socket.id})`);

      socket.on("join_room", (roomId: string) => {
        socket.join(roomId);
      });

      socket.on("send_message", async (data) => this.sendMessageEvent.execute(socket, user, data));

      socket.on("disconnect", () => {
        console.log(`Disconnected: ${user.name}`);
      });
    });
  }
}
