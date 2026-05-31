import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { PresenceService } from "../services/presence.service";
import { Socket } from "socket.io";
import type { User } from "better-auth";

@injectable()
export class HeartbeatCommand implements WebSocketCommand {
  public readonly eventName = "heartbeat";

  constructor(@inject(TYPES.PresenceService) private presenceService: PresenceService) {}

  public async execute(socket: Socket, user: User, data: any): Promise<void> {
    await this.presenceService.refreshPresence(user.id);
    socket.emit("user_status_change", { userId: user.id, status: "online" });
  }
}
