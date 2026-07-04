import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Request, Response, NextFunction } from "express";
import type { Redis } from "ioredis";
import { BaseController } from "@/utils/base.controller";
import { PresenceService } from "@/services/presence.service";
import { ConnectionsRepository } from "@/modules/connection/connections.repository";
import { ChannelsRepository } from "@/modules/channel/channels.repository";
import { createLogger } from "@/lib/logger";

const log = createLogger("Presence");

@injectable()
export class PresenceController extends BaseController {
  constructor(
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
    @inject(TYPES.ConnectionsRepository) private connectionsRepository: ConnectionsRepository,
    @inject(TYPES.ChannelsRepository) private channelsRepository: ChannelsRepository,
    @inject(TYPES.RedisMainClient) private redis: Redis,
  ) {
    super();
  }

  public syncSnapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const activeChannelId = typeof req.query.channelId === "string" ? req.query.channelId : "";

      // 1. Check if our base contact cache exists
      const contactKey = `presence:contacts:${authUserId}`;
      const baseCacheExists = await this.redis.exists(contactKey);

      if (!baseCacheExists) {
        log.warn({ authId: authUserId }, "Rebuilding contacts cache");
        const databaseContacts = await this.connectionsRepository.getRawContactIds(authUserId);

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
          const channelMemberIds = await this.channelsRepository.getRawMemberIds(
            authUserId,
            parseInt(activeChannelId, 10),
          );

          await this.presenceService.setChannelMembersLookup(activeChannelId, channelMemberIds);
        }
      }

      // 3. Compile and pull the consolidated map out of pure Redis
      const channelsToAggregate = activeChannelId ? [activeChannelId] : [];
      const data = await this.presenceService.getAggregatedPresenceMap(authUserId, channelsToAggregate);

      this.sendSuccess(res, data, "Presence view state synced successfully", 200);
    } catch (error: unknown) {
      next(error);
    }
  };
}
