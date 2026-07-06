import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { PresenceService } from "@/services/presence.service";
import { BroadcasterService } from "@/services/broadcaster.service";
import { ConnectionsRepository } from "@/modules/connection/connections.repository";

@injectable()
export class HeartbeatCommand implements WebSocketCommand {
  public readonly eventName = "connection:heartbeat";

  constructor(
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
    @inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService,
    @inject(TYPES.ConnectionsRepository) private connectionsRepository: ConnectionsRepository,
  ) {}

  public async execute(socket: Socket, authId: string, _data: unknown): Promise<void> {
    const stateTransition = await this.presenceService.trackHeartbeat(authId);

    // TARGETED MULTI-CAST: Only notify followers if they transitioned from offline -> online
    if (stateTransition === "LOGIN") {
      // 1. Fetch live active observers from Redis cache
      let observerIds = await this.presenceService.getFollowers(authId);

      // 2. CRITICAL HEARTBEAT SELF-HEALING BRIDGE:
      // If the followers index set is missing/empty, look up relational bounds in Postgres
      if (observerIds.length === 0) {
        const persistedContacts = await this.connectionsRepository.getRawContactIds(authId);

        if (persistedContacts.length > 0) {
          // Rebuild relationship keys cleanly in Redis
          for (const friendId of persistedContacts) {
            await this.presenceService.setPresenceLookup(authId, friendId);
          }
          observerIds = persistedContacts;
        }
      }

      const deltaPayload = { userId: authId, status: "online" };

      // Route delta updates directly to the private rooms of active observers
      for (const observerId of observerIds) {
        await this.broadcaster.emitToUser(observerId, "connection:status_change", deltaPayload);
      }
    }
  }
}
