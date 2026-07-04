import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { NotificationsController } from "./notifications.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/request.middleware";
import { markAsReadBodySchema, notificationsQuerySchema } from "./notifications.schema";

@injectable()
export class NotificationsRouter implements HttpRouter {
  public path = "/notifications";
  public router = Router();

  constructor(@inject(TYPES.NotificationsController) private notificationsController: NotificationsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      this.path,
      [authMiddleware, validate({ query: notificationsQuerySchema })],
      this.notificationsController.getNotifications,
    );

    this.router.post(
      `${this.path}/mark-as-read`,
      [authMiddleware, validate({ body: markAsReadBodySchema })],
      this.notificationsController.markAsRead,
    );
  }
}
