import { injectable, inject, multiInject } from "inversify";
import { TYPES } from "@/config/types";
import { Server as SocketServer, type Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { redisClient } from "@/lib/redis";
import type { User } from "@supabase/supabase-js";

@injectable()
export class WebSocketService {
  private commandRegistry = new Map<string, WebSocketCommand>();

  constructor(
    @inject(TYPES.SocketServer) private webSocketServer: SocketServer,
    @multiInject(TYPES.WebSocketCommand) commands: WebSocketCommand[],
  ) {
    // Build the dynamic command routing index map automatically
    commands.forEach((command) => {
      this.commandRegistry.set(command.eventName, command);
      console.log(`📡 [WebSocketService] Registered Strategy Router for: [${command.eventName}]`);
    });
  }

  /**
   * Initializes the core connection listener and mounts the dynamic dispatch routine
   */
  public start(): void {
    this.webSocketServer.on("connection", (socket: Socket) => {
      const authId = socket.data.authId;
      console.log(`🟩 Connected: ${authId} (${socket.id})`);

      // Join a private notification room unique to this specific user profile instance
      void socket.join(`user:${authId}`);

      // Emit the current list of online users directly to this newly connected client
      void this.syncOnlinePresence(socket);

      // DYNAMIC COMMAND ROUTER LOOP
      // Listen for incoming triggers from the registry map dynamically
      for (const [eventName, command] of this.commandRegistry.entries()) {
        socket.on(eventName, async (data: unknown) => {
          try {
            await command.execute(socket, authId, data);
          } catch (error) {
            console.error(`❌ Command runtime crash on event [${eventName}]:`, error);
            socket.emit("error", {
              message: `Internal server failure handling action: ${eventName}`,
            });
          }
        });
      }
    });
  }

  /**
   * Private helper routine to fetch presence lists from Redis
   */
  private async syncOnlinePresence(socket: Socket): Promise<void> {
    try {
      const onlineUserIds = await redisClient.smembers("presence:online_users");
      socket.emit("online_users_list", onlineUserIds);
    } catch (error) {
      console.error("Failed to synchronize socket online presence matrix:", error);
    }
  }
}
