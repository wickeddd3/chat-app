import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { PresenceService } from "@/services/presence.service";
import type { Request, Response, NextFunction } from "express";
import { ConnectionsRepository } from "../connection/connections.repository";

@injectable()
export class PresenceController extends BaseController {
  constructor(
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
    @inject(TYPES.ConnectionsRepository) private connectionsRepository: ConnectionsRepository,
  ) {
    super();
  }

  public syncSnapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";

      // 1. Get snapshot map
      let data = await this.presenceService.getAggregatedPresenceMap(authUserId);

      // 2. SELF-HEALING CASCADE: Execute fallback routine if Redis graph was lost or evicted
      if (data === null) {
        console.warn(`⚠️ [PresenceController] Cache miss detected for ${authUserId}. Repairing from Repository...`);

        // Fetch contacts directly from Postgres
        const persistedContacts = await this.connectionsRepository.getRawContactIds(authUserId);

        if (persistedContacts.length > 0) {
          // Re-populate the bi-directional pairs in Redis memory
          for (const friendId of persistedContacts) {
            await this.presenceService.setPresenceLookup(authUserId, friendId);
          }

          // Re-evaluate map now that the cache infrastructure is healed
          data = (await this.presenceService.getAggregatedPresenceMap(authUserId)) ?? {};
        } else {
          // Guard against endless DB hitting loop if they legitimately have 0 contacts
          await this.presenceService.setEmptyPresenceMarker(authUserId);
          data = {};
        }
      }

      this.sendSuccess(res, data, "Presence map successfully compiled and synchronized", 200);
    } catch (error: unknown) {
      next(error);
    }
  };
}
