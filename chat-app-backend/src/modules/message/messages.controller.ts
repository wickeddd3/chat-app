import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { MessagesService } from "./messages.service";
import { ChannelsService } from "@/modules/channel/channels.service";
import { HttpException } from "@/utils/http.exception";
import type { Request, Response } from "express";

@injectable()
export class MessagesController extends BaseController {
  constructor(
    @inject(TYPES.MessagesService) private messagesService: MessagesService,
    @inject(TYPES.ChannelsService) private channelsService: ChannelsService,
  ) {
    super();
  }

  public getMessages = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const channelId = req.params.channelId as string;
    const limit = 20;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";

    // Authorization: only members may read a channel's message history.
    if (!(await this.channelsService.isMember(authUserId, channelId))) {
      throw new HttpException(403, "You do not have access to this channel.");
    }

    const { messages, nextCursor, hasMore } = await this.messagesService.getMessages({
      channelId,
      limit,
      cursor,
    });

    this.sendSuccess(res, messages, "Messages fetched successfully", 200, {
      limit,
      nextCursor,
      hasMore,
    });
  };
}
