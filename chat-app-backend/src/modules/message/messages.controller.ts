import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { MessagesService } from "./messages.service";
import type { Request, Response, NextFunction } from "express";

@injectable()
export class MessagesController extends BaseController {
  constructor(@inject(TYPES.MessagesService) private messagesService: MessagesService) {
    super();
  }

  public getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
