import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { PresenceService } from "../services/presence.service";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";

@injectable()
export class HeartbeatCommand implements WebSocketCommand {
  public readonly eventName = "heartbeat";

  constructor(
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
    @inject(TYPES.WebSocketBroadcaster) private broadcaster: WebSocketBroadcaster,
  ) {}

  public async execute(socket: Socket, authId: string, _data: unknown): Promise<void> {
    await this.presenceService.refreshPresence(authId);

    await this.broadcaster.emitToRoom("presence:global", "user_status_change", {
      userId: authId,
      status: "online",
    });
  }
}
