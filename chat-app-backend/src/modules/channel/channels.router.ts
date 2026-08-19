import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { ChannelsController } from "./channels.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/request.middleware";
import {
  channelIdParamsSchema,
  groupAvatarBodySchema,
  groupChannelBodySchema,
  listChannelsQuerySchema,
  targetUserIdParamsSchema,
} from "./channels.schema";

@injectable()
export class ChannelsRouter implements HttpRouter {
  public path = "/channels";
  public router = Router();

  constructor(@inject(TYPES.ChannelsController) private channelsController: ChannelsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      this.path,
      [authMiddleware, validate({ query: listChannelsQuerySchema })],
      this.channelsController.getChannels,
    );

    this.router.get(
      `${this.path}/:channelId`,
      [authMiddleware, validate({ params: channelIdParamsSchema })],
      this.channelsController.getChannel,
    );

    this.router.get(
      `${this.path}/find/:targetUserId`,
      [authMiddleware, validate({ params: targetUserIdParamsSchema })],
      this.channelsController.findChannelOrCreate,
    );

    this.router.post(
      `${this.path}/group`,
      [authMiddleware, validate({ body: groupChannelBodySchema })],
      this.channelsController.createGroupChannel,
    );

    this.router.post(
      `${this.path}/group/:channelId`,
      [authMiddleware, validate({ params: channelIdParamsSchema, body: groupChannelBodySchema })],
      this.channelsController.updateGroupChannel,
    );

    this.router.patch(
      `${this.path}/group/:channelId/image`,
      [authMiddleware, validate({ params: channelIdParamsSchema, body: groupAvatarBodySchema })],
      this.channelsController.updateGroupAvatar,
    );

    this.router.delete(
      `${this.path}/group/:channelId/members/me`,
      [authMiddleware, validate({ params: channelIdParamsSchema })],
      this.channelsController.leaveGroupChannel,
    );
  }
}
