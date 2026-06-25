import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Request, Response, NextFunction } from "express";
import { BaseController } from "@/utils/base.controller";
import { ChannelsRepository } from "@/modules/channel/channels.repository";
import { NotificationsRepository } from "../notification/notifications.repository";
import { ConnectionsRepository } from "../connection/connections.repository";

@injectable()
export class StatsController extends BaseController {
  constructor(
    @inject(TYPES.ChannelsRepository) private channelsRepository: ChannelsRepository,
    @inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository,
    @inject(TYPES.ConnectionsRepository) private connectionsRepository: ConnectionsRepository,
  ) {
    super();
  }

  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";

      const [unreadMessagesCount, unreadNotificationsCount, pendingRequestsCount] = await Promise.all([
        this.channelsRepository.getUnreadMessagesCount({ authUserId }),
        this.notificationsRepository.getUnreadNotificationsCount({ authUserId }),
        this.connectionsRepository.getReceivedConnectionsCount({ authUserId }),
      ]);

      const stats = { unreadMessagesCount, unreadNotificationsCount, pendingRequestsCount };

      this.sendSuccess(res, stats, "Stats retrieved successfully", 200);
    } catch (error: unknown) {
      next(error);
    }
  };
}
