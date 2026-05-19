import { Event } from "@/interfaces/event.interface";
import type { User } from "better-auth";
import type { Socket } from "socket.io";
import { PresenceService } from "../services/presence.service";

export class HeartbeatEvent implements Event {
  private presenceService = new PresenceService();
  private webSocketServer;

  constructor(webSocketServer: any) {
    this.webSocketServer = webSocketServer;
  }

  public async execute(socket: Socket, user: User, data: any) {
    try {
      await this.presenceService.refreshPresence(user.id);
      this.webSocketServer.emit("user_status_change", { userId: user.id, status: "online" });
    } catch (error) {
      console.error("Failed to refresh online user presence:", error);
      socket.emit("error", { message: "Failed to refresh online user presence" });
    }
  }
}
