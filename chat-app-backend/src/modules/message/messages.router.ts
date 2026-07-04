import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { MessagesController } from "./messages.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/request.middleware";
import { messagesParamsSchema, messagesQuerySchema } from "./messages.schema";

@injectable()
export class MessagesRouter implements HttpRouter {
  public path = "/messages";
  public router = Router();

  constructor(@inject(TYPES.MessagesController) private messagesController: MessagesController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${this.path}/:channelId`,
      [authMiddleware, validate({ params: messagesParamsSchema, query: messagesQuerySchema })],
      this.messagesController.getMessages,
    );
  }
}
