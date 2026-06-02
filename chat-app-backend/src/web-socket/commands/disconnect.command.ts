import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { PresenceService } from "../services/presence.service";
import { Socket } from "socket.io";
import type { User } from "better-auth";

@injectable()
export class DisconnectCommand implements WebSocketCommand {
  public readonly eventName = "disconnect";

  constructor(@inject(TYPES.PresenceService) private presenceService: PresenceService) {}

  public async execute(socket: Socket, user: User, _data: unknown): Promise<void> {
    console.log(`🟥 Disconnected: ${user.name} (${socket.id})`);
    await this.presenceService.removePresence(user.id);
    socket.emit("user_status_change", { userId: user.id, status: "offline" });
  }
}
