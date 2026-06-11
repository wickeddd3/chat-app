import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { Controller } from "@/interfaces/controller.interface";
import { NotificationsService } from "./notifications.service";
import { Router, type Request, type Response, type NextFunction } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class NotificationsController extends BaseController implements Controller {
  public path = "/notifications";
  public router = Router();

  constructor(@inject(TYPES.NotificationsService) private notificationsService: NotificationsService) {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, [authMiddleware], this.getNotifications);
    this.router.post(`${this.path}/mark-as-read`, [authMiddleware], this.markAsRead);
  }

  private getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const limit = 20;
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";

      const { notifications, nextCursor, hasMore } = await this.notificationsService.getByUserId({
        userId: authUserId,
        limit,
        cursor,
      });

      this.sendSuccess(res, notifications, "Notifications fetched successfully", 200, {
        limit,
        nextCursor,
        hasMore,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  private markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const body = req.body as { notificationIds?: unknown };
      const notificationIds = Array.isArray(body.notificationIds) ? (body.notificationIds as string[]) : [];

      const notifications = await this.notificationsService.markAsRead({
        userId: authUserId,
        notificationIds,
      });

      this.sendSuccess(res, notifications, "Notifications mark as read successfully");
    } catch (error: unknown) {
      next(error);
    }
  };
}
