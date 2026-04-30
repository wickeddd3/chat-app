import { Server as WebSocketServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { APP_URL } from "@/config/app.config";
import { MessagesService } from "@/modules/message/messages.service";
import { socketAuthMiddleware } from "@/middlewares/socket-auth.middleware";

export class SocketService {
  private io: WebSocketServer;
  private messagesService = new MessagesService();

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
    this.io.use(socketAuthMiddleware);
  }

  private setupEventListeners(): void {
    this.io.on("connection", (socket: Socket) => {
      const user = socket.data.user;
      console.log(`Connected: ${user.name} (${socket.id})`);

      socket.on("join_room", (roomId: string) => {
        socket.join(roomId);
      });

      socket.on("send_message", async (data) => {
        try {
          // 1. Persist to Database
          const savedMessage = await this.messagesService.saveMessage({
            content: data.content,
            roomId: data.roomId,
            authorId: user.id,
          });
          // 2. Broadcast the saved message to the room
          this.io.to(data.roomId).emit("receive_message", {
            clientId: data.clientId, // Echo back clientId for optimistic UI reconciliation
            id: savedMessage.id,
            content: savedMessage.content,
            roomId: savedMessage.roomId,
            author: {
              id: savedMessage.author.id,
              name: savedMessage.author.name,
              image: savedMessage.author.image,
            },
            createdAt: savedMessage.createdAt,
          });
        } catch (error) {
          console.error("Failed to persist message:", error);
          socket.emit("error", { message: "Message could not be sent" });
        }
      });

      socket.on("disconnect", () => {
        console.log(`Disconnected: ${user.name}`);
      });
    });
  }
}
