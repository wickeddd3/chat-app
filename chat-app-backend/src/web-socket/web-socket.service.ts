import { Server as SocketServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { APP_URL } from "@/config/app.config";
import { socketAuthMiddleware } from "@/middlewares/socket-auth.middleware";
import type { Event } from "@/interfaces/event.interface";
import { redisClient } from "@/lib/redis";
import { JoinChannelEvent } from "./events/join-channel.event";
import { LeaveChannelEvent } from "./events/leave-channel.event";
import { DisconnectEvent } from "./events/disconnect.event";
import { HeartbeatEvent } from "./events/heartbeat.event";
import { SendMessageEvent } from "./events/send-message.event";
import { ReadMessageEvent } from "./events/read-message.event";

export class WebSocketService {
  private webSocketServer: SocketServer;
  private joinChannelEvent!: Event;
  private leaveChannelEvent!: Event;
  private disconnectEvent!: Event;
  private heartbeatEvent!: Event;
  private sendMessageEvent!: Event;
  private readMessageEvent!: Event;

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
    this.joinChannelEvent = new JoinChannelEvent();
    this.leaveChannelEvent = new LeaveChannelEvent();
    this.disconnectEvent = new DisconnectEvent(this.webSocketServer);
    this.heartbeatEvent = new HeartbeatEvent(this.webSocketServer);
    this.sendMessageEvent = new SendMessageEvent(this.webSocketServer);
    this.readMessageEvent = new ReadMessageEvent(this.webSocketServer);
  }

  public start(): void {
    this.webSocketServer.on("connection", async (socket: Socket) => {
      const user = socket.data.user;
      console.log(`Connected: ${user.name} (${socket.id})`);

      // Fetch the full list of online users from Redis
      const onlineUserIds = await redisClient.sMembers("presence:online_users");
      // Emit only to the connecting user (private message)
      socket.emit("online_users_list", onlineUserIds);

      socket.on("join_channel", async (data) => this.joinChannelEvent.execute(socket, user, data));
      socket.on("leave_channel", async (data) => this.leaveChannelEvent.execute(socket, user, data));
      socket.on("disconnect", async (data) => this.disconnectEvent.execute(socket, user, data));
      socket.on("heartbeat", async (data) => this.heartbeatEvent.execute(socket, user, data));
      socket.on("send_message", async (data) => this.sendMessageEvent.execute(socket, user, data));
      socket.on("mark_as_read", async (data) => this.readMessageEvent.execute(socket, user, data));
    });
  }
}
