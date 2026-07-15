import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { NotificationsService } from "./notifications.service";
import type { Request, Response } from "express";

@injectable()
export class NotificationsController extends BaseController {
  constructor(@inject(TYPES.NotificationsService) private notificationsService: NotificationsService) {
    super();
  }

  public getNotifications = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const limit = 20;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    // The HTTP tab filter maps onto the domain-level isRead flag; "all" omits it
    // entirely so both read and unread records are returned.
    const unreadOnly = req.query.filter === "unread";

    const { notifications, nextCursor, hasMore, total } = await this.notificationsService.getByUserId({
      userId: authUserId,
      limit,
      cursor,
      ...(unreadOnly && { isRead: false }),
    });

    this.sendSuccess(res, notifications, "Notifications fetched successfully", 200, {
      limit,
      nextCursor,
      hasMore,
      total,
    });
  };

  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const body = req.body as { notificationIds?: unknown };
    const notificationIds = Array.isArray(body.notificationIds) ? (body.notificationIds as string[]) : [];

    const notifications = await this.notificationsService.markAsRead({
      userId: authUserId,
      notificationIds,
    });

    this.sendSuccess(res, notifications, "Notifications mark as read successfully");
  };
}
