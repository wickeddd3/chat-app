import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { MessagesController } from "./messages.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class MessagesRouter implements HttpRouter {
  public path = "/messages";
  public router = Router();

  constructor(@inject(TYPES.MessagesController) private messagesController: MessagesController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:channelId`, [authMiddleware], this.messagesController.getMessages);
  }
}
