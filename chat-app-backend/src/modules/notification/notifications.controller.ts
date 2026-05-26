import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import HttpException from "@/utils/http.exception";
import { type NextFunction, type Response, Router } from "express";
import { NotificationsService } from "./notifications.service";
import { authMiddleware } from "@/middlewares/auth.middleware";

export class NotificationsController implements Controller {
  public path = "/notifications";
  public router = Router();
  private notificationsService = new NotificationsService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [authMiddleware], this.getNotifications);
    this.router.post(`${this.path}/mark-as-read`, [authMiddleware], this.markAsRead);
  }

  private getNotifications = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = (req.user?.id as string) || "";
      const limit = 20;
      const cursor = req?.query?.cursor as string;
      const notifications = await this.notificationsService.getByUserId({
        userId: authUserId,
        limit,
        cursor,
      });

      res.status(200).json(notifications);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve notifications"));
    }
  };

  private markAsRead = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = (req.user?.id as string) || "";
      const notificationIds = (req?.body?.notificationIds as string[]) || [];
      const notifications = await this.notificationsService.markAsRead({
        userId: authUserId,
        notificationIds,
      });

      res.status(200).json(notifications);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to mark notifications as read"));
    }
  };
}
