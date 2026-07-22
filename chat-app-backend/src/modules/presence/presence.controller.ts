import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Request, Response } from "express";
import { BaseController } from "@/utils/base.controller";
import { PresenceService } from "@/services/presence.service";
import { ConnectionsQuery } from "@/modules/connection/persistence/connections.query";
import { ChannelMembersRepository } from "@/modules/channel/persistence/channel-members.repository";
import { UsersQuery } from "@/modules/user/persistence/users.query";
import { createLogger } from "@/lib/logger";

const log = createLogger("Presence");

@injectable()
export class PresenceController extends BaseController {
  constructor(
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
    @inject(TYPES.ConnectionsQuery) private connectionsQuery: ConnectionsQuery,
    @inject(TYPES.ChannelMembersRepository) private channelMembersRepository: ChannelMembersRepository,
    @inject(TYPES.UsersQuery) private usersQuery: UsersQuery,
  ) {
    super();
  }

  public syncSnapshot = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const activeChannelId = typeof req.query.channelId === "string" ? req.query.channelId : "";

    // 1. Check if our base contact cache exists
    const baseCacheExists = await this.presenceService.checkContactCacheExists(authUserId);

    if (!baseCacheExists) {
      log.warn({ authId: authUserId }, "Rebuilding contacts cache");
      const databaseContacts = await this.connectionsQuery.getContactIds(authUserId);

      if (databaseContacts.length > 0) {
        for (const friendId of databaseContacts) {
          await this.presenceService.setPresenceLookup(authUserId, friendId);
        }
      } else {
        await this.presenceService.setEmptyPresenceMarker(authUserId);
      }
    }

    // 2. Check if the active channel list needs self-healing reconstruction
    if (activeChannelId) {
      const channelCacheExists = await this.presenceService.checkChannelCacheExists(activeChannelId);

      if (!channelCacheExists) {
        log.warn({ channelId: activeChannelId }, "Rebuilding channel cache");
        // Fetch raw string member IDs from your channel/prisma repository layer
        const channelMemberIds = await this.channelMembersRepository.getMemberIds(authUserId, activeChannelId);

        await this.presenceService.setChannelMembersLookup(activeChannelId, channelMemberIds);
      }
    }

    // 3. Compile and pull the consolidated map out of pure Redis
    const channelsToAggregate = activeChannelId ? [activeChannelId] : [];
    const data = await this.presenceService.getAggregatedPresenceMap(authUserId, channelsToAggregate);

    // 4. Durability fallback: any offline user whose Redis last-seen has expired
    // (or was flushed) gets it from the persisted Postgres copy — one query, cold
    // entries only.
    const coldOfflineIds = Object.entries(data)
      .filter(([, entry]) => entry.status === "offline" && entry.lastSeen === null)
      .map(([userId]) => userId);

    if (coldOfflineIds.length > 0) {
      const persisted = await this.usersQuery.getLastSeenByIds(coldOfflineIds);
      for (const [userId, lastSeen] of Object.entries(persisted)) {
        const entry = data[userId];
        if (entry) entry.lastSeen = lastSeen;
      }
    }

    this.sendSuccess(res, data, "Presence view state synced successfully", 200);
  };
}
