import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { MessagesService } from "./messages.service";
import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import HttpException from "@/utils/http.exception";
import { type NextFunction, type Response, Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class MessagesController implements Controller {
  public path = "/messages";
  public router = Router();

  constructor(@inject(TYPES.MessagesService) private messagesService: MessagesService) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:channelId`, [authMiddleware], this.getMessages);
  }

  private getMessages = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const channelId = req.params.channelId as string;
      const limit = 20;
      const cursor = req?.query?.cursor as string;
      const messages = await this.messagesService.getMessages({
        channelId: parseInt(channelId),
        limit,
        cursor: parseInt(cursor),
      });

      res.status(200).json(messages);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve messages"));
    }
  };
}
