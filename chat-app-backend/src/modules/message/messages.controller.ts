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
    this.router.get(`${this.path}/inbox`, [authMiddleware], this.getInbox);
    this.router.get(`${this.path}/inbox/:roomId`, [authMiddleware], this.getMessagesByRoomId);
  }

  private getInbox = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req?.user?.id || "";
      const messages = await this.messagesService.getInbox(authUserId);

      res.status(200).json(messages);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve messages"));
    }
  };

  private getMessagesByRoomId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const messages = await this.messagesService.getMessagesByRoomId(roomId);

      res.status(200).json(messages);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve messages"));
    }
  };
}
