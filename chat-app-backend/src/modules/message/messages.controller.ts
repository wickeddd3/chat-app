import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import { MessagesService } from "./messages.service";
import { type NextFunction, type Response, Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class MessagesController extends BaseController implements Controller {
  public path = "/messages";
  public router = Router();

  constructor(@inject(TYPES.MessagesService) private messagesService: MessagesService) {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:channelId`, [authMiddleware], this.getMessages);
  }

  private getMessages = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const channelId = req.params.channelId as string;
      const limit = 20;
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";

      const { messages, nextCursor, hasMore } = await this.messagesService.getMessages({
        channelId: parseInt(channelId),
        limit,
        cursor: parseInt(cursor),
      });

      this.sendSuccess(res, messages, "Messages fetched successfully", 200, {
        limit,
        nextCursor,
        hasMore,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
