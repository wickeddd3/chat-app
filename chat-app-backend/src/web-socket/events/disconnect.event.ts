import { Event } from "@/interfaces/event.interface";
import type { User } from "better-auth";
import type { Socket } from "socket.io";
import { PresenceService } from "../services/presence.service";

export class DisconnectEvent implements Event {
  private presenceService = new PresenceService();
  private webSocketServer;

  constructor(webSocketServer: any) {
    this.webSocketServer = webSocketServer;
  }

  public async execute(socket: Socket, user: User, data: any) {
    try {
      console.log(`Disconnected: ${user.name}`);
      await this.presenceService.removePresence(user.id);
      this.webSocketServer.emit("user_status_change", { userId: user.id, status: "offline" });
    } catch (error) {
      console.error("Failed to join channel:", error);
      socket.emit("error", { message: "Failed to join channel" });
    }
  }
}
