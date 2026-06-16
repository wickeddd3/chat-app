import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { PresenceService } from "@/services/presence.service";
import type { Request, Response, NextFunction } from "express";

@injectable()
export class PresenceController extends BaseController {
  constructor(@inject(TYPES.PresenceService) private presenceService: PresenceService) {
    super();
  }

  public syncSnapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const { channelId } = req.body; // Optional active room view context

      const data = await this.presenceService.getAggregatedPresenceMap(authUserId, channelId);

      this.sendSuccess(res, data, "Presence map fetched successfully", 200);
    } catch (error: unknown) {
      next(error);
    }
  };
}
