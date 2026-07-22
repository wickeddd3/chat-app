import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Request, Response } from "express";
import { BaseController } from "@/utils/base.controller";
import { ChannelsRepository } from "@/modules/channel/channels.repository";
import { NotificationsRepository } from "../notification/notifications.repository";
import { ConnectionsQuery } from "../connection/persistence/connections.query";

@injectable()
export class StatsController extends BaseController {
  constructor(
    @inject(TYPES.ChannelsRepository) private channelsRepository: ChannelsRepository,
    @inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository,
    @inject(TYPES.ConnectionsQuery) private connectionsQuery: ConnectionsQuery,
  ) {
    super();
  }

  public getStats = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";

    const [unreadMessagesCount, unreadNotificationsCount, pendingRequestsCount] = await Promise.all([
      this.channelsRepository.getUnreadMessagesCount({ authUserId }),
      this.notificationsRepository.getUnreadNotificationsCount({ authUserId }),
      this.connectionsQuery.getReceivedConnectionsCount({ authUserId }),
    ]);

    const stats = { unreadMessagesCount, unreadNotificationsCount, pendingRequestsCount };

    this.sendSuccess(res, stats, "Stats retrieved successfully", 200);
  };
}
