import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { PresenceService } from "../services/presence.service";
import { Socket } from "socket.io";

@injectable()
export class HeartbeatCommand implements WebSocketCommand {
  public readonly eventName = "heartbeat";

  constructor(@inject(TYPES.PresenceService) private presenceService: PresenceService) {}

  public async execute(socket: Socket, authId: string, _data: unknown): Promise<void> {
    await this.presenceService.refreshPresence(authId);
    socket.emit("user_status_change", { userId: authId, status: "online" });
  }
}
