import { Server as SocketServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { APP_URL } from "@/config/app.config";
import { socketAuthMiddleware } from "@/middlewares/socket-auth.middleware";
import type { Event } from "@/interfaces/event.interface";
import { SendMessageEvent } from "./events/send-message.event";
import { redisClient } from "@/lib/redis";

export class WebSocketService {
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
  }

  private initializeMiddleware(): void {
    this.webSocketServer.use(socketAuthMiddleware);
  }

  private initializeEvents(): void {
    this.sendMessageEvent = new SendMessageEvent(this.webSocketServer);
  }

  public start(): void {
    this.webSocketServer.on("connection", async (socket: Socket) => {
      const user = socket.data.user;
      const userId = socket.data.user.id;

      console.log(`Connected: ${user.name} (${socket.id})`);

      // 1. Initial check-in
      await this.refreshPresence(userId);

      // 2. Fetch the full list of online users from Redis
      const onlineUserIds = await redisClient.sMembers("presence:online_users");

      // 3. Emit only to the connecting user (private message)
      socket.emit("online_users_list", onlineUserIds);

      // 4. Listen for the pulse from the frontend
      socket.on("heartbeat", async () => {
        await this.refreshPresence(userId);
      });

      socket.on("join_channel", (channelId: string) => {
        console.log(`User ${user.id} join channel: ${channelId}`);
        socket.join(channelId);
      });

      socket.on("send_message", async (data) => this.sendMessageEvent.execute(socket, user, data));

      socket.on("leave_channel", (channelId: string) => {
        console.log(`User ${user.id} left channel: ${channelId}`);
        socket.leave(channelId);
      });

      socket.on("disconnect", async () => {
        console.log(`Disconnected: ${user.name}`);

        // Try to clean up manually for speed
        await this.removePresence(userId);
      });
    });
  }

  private async refreshPresence(userId: string): Promise<void> {
    const ttlKey = `presence:active:${userId}`;
    const onlineSetKey = "presence:online_users";

    // Set/Update key with a 60-second expiration
    await redisClient.set(ttlKey, "true", { EX: 60 });

    // Add to searchable online set
    await redisClient.sAdd(onlineSetKey, userId);

    this.webSocketServer.emit("user_status_change", { userId, status: "online" });
  }

  private async removePresence(userId: string): Promise<void> {
    await redisClient.del(`presence:active:${userId}`);
    await redisClient.sRem("presence:online_users", userId);

    this.webSocketServer.emit("user_status_change", { userId, status: "offline" });
  }
}
