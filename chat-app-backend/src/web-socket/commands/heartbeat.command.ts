import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import type { Redis } from "ioredis";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { PresenceService } from "../../services/presence.service";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";

@injectable()
export class HeartbeatCommand implements WebSocketCommand {
  public readonly eventName = "heartbeat";

  constructor(
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
    @inject(TYPES.WebSocketBroadcaster) private broadcaster: WebSocketBroadcaster,
    @inject(TYPES.RedisMainClient) private redis: Redis,
  ) {}

  public async execute(socket: Socket, authId: string, _data: unknown): Promise<void> {
    const stateTransition = await this.presenceService.trackHeartbeat(authId);

    // TARGETED MULTI-CAST: Only notify followers if they transitioned from offline -> online
    if (stateTransition === "LOGIN") {
      // Find all people who have this user in their contact list graph
      const observerIds = await this.redis.smembers(`presence:followers_of:${authId}`);

      const deltaPayload = { userId: authId, status: "online" };

      // Route delta updates directly to the private rooms of active observers
      for (const observerId of observerIds) {
        await this.broadcaster.emitToUser(observerId, "user_status_change", deltaPayload);
      }
    }
  }
}
