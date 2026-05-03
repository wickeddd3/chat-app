import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import HttpException from "@/utils/http.exception";
import { type NextFunction, type Request, type Response, Router } from "express";
import { MessagesService } from "./messages.service";
import { authMiddleware } from "@/middlewares/auth.middleware";

export class MessagesController implements Controller {
  public path = "/messages";
  public router = Router();
  private messagesService = new MessagesService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:channelId`, [authMiddleware], this.getMessages);
  }

  private getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const channelId = req.params.channelId as string;
      const messages = await this.messagesService.getMessages(parseInt(channelId));

      res.status(200).json(messages);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve messages"));
    }
  };
}
