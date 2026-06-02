import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import { ChannelsService } from "./channels.service";
import { type NextFunction, type Response, Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { channelToChannelDetails, channelToInboxChannel } from "./channels.transformer";

@injectable()
export class ChannelsController extends BaseController implements Controller {
  public path = "/channels";
  public router = Router();

  constructor(@inject(TYPES.ChannelsService) private channelsService: ChannelsService) {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, [authMiddleware], this.getChannels);
    this.router.get(`${this.path}/:channelId`, [authMiddleware], this.getChannel);
    this.router.get(`${this.path}/find/:targetUserId`, [authMiddleware], this.findChannelOrCreate);
    this.router.post(`${this.path}/group`, [authMiddleware], this.createGroupChannel);
    this.router.post(`${this.path}/group/:channelId`, [authMiddleware], this.updateGroupChannel);
  }

  private getChannels = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id ?? "";
      const limit = 20;
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
      const query = typeof req.query.query === "string" ? req.query.query : "";

      const data = await this.channelsService.getChannels({ authUserId, limit, cursor, query });

      const transformedChannels = data.channels.map((channel) => channelToInboxChannel(channel, authUserId));
      const { channels, nextCursor, hasMore } = { ...data, channels: transformedChannels };

      this.sendSuccess(res, channels, "Channels fetched successfully", 200, {
        limit,
        nextCursor,
        hasMore,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  private getChannel = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id ?? "";
      const channelId = typeof req.params.channelId === "string" ? req.params.channelId : "";
      const channel = await this.channelsService.getChannel(authUserId, parseInt(channelId));

      const transformedChannel = channel ? channelToChannelDetails(channel, authUserId) : null;

      this.sendSuccess(res, transformedChannel, "Channel retrieved successfully");
    } catch (error: unknown) {
      next(error);
    }
  };

  private findChannelOrCreate = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id ?? "";
      const targetUserId = typeof req.params.targetUserId === "string" ? req.params.targetUserId : "";

      const channel = await this.channelsService.findChannelOrCreate(authUserId, targetUserId);

      this.sendSuccess(res, channel, "Channel retrieved successfully");
    } catch (error: unknown) {
      next(error);
    }
  };

  private createGroupChannel = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id ?? "";
      const body = req.body as { name?: unknown; memberIds?: unknown };
      const name = typeof body.name === "string" ? body.name : "";
      const memberIds = Array.isArray(body.memberIds) ? (body.memberIds as string[]) : [];

      const channel = await this.channelsService.createGroupChannel(authUserId, { name, memberIds });

      this.sendSuccess(res, channel, "Group channel created successfully");
    } catch (error: unknown) {
      next(error);
    }
  };

  private updateGroupChannel = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id ?? "";
      const channelId = typeof req.params.channelId === "string" ? req.params.channelId : "";
      const body = req.body as { name?: unknown; memberIds?: unknown };
      const name = typeof body.name === "string" ? body.name : "";
      const memberIds = Array.isArray(body.memberIds) ? (body.memberIds as string[]) : [];

      const channel = await this.channelsService.updateGroupChannel(authUserId, parseInt(channelId), {
        name,
        memberIds,
      });

      this.sendSuccess(res, channel, "Group channel updated successfully");
    } catch (error: unknown) {
      next(error);
    }
  };
}
