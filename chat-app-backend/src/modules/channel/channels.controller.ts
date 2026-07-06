import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { ChannelsService } from "./channels.service";
import type { Request, Response } from "express";
import { channelToChannelDetails, channelToInboxChannel } from "./channels.transformer";
import { HttpException } from "@/utils/http.exception";

@injectable()
export class ChannelsController extends BaseController {
  constructor(@inject(TYPES.ChannelsService) private channelsService: ChannelsService) {
    super();
  }

  public getChannels = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
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
  };

  public getChannel = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const channelId = typeof req.params.channelId === "string" ? req.params.channelId : "";
    const channel = await this.channelsService.getChannel(authUserId, channelId);

    const transformedChannel = channel ? channelToChannelDetails(channel, authUserId) : null;

    this.sendSuccess(res, transformedChannel, "Channel retrieved successfully");
  };

  public findChannelOrCreate = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const targetUserId = typeof req.params.targetUserId === "string" ? req.params.targetUserId : "";

    const channel = await this.channelsService.findChannelOrCreate(authUserId, targetUserId);

    this.sendSuccess(res, channel, "Channel retrieved successfully");
  };

  public createGroupChannel = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const body = req.body as { name?: unknown; memberIds?: unknown };
    const name = typeof body.name === "string" ? body.name : "";
    const memberIds = Array.isArray(body.memberIds) ? (body.memberIds as string[]) : [];

    const channel = await this.channelsService.createGroupChannel(authUserId, { name, memberIds });

    this.sendSuccess(res, channel, "Group channel created successfully");
  };

  public updateGroupChannel = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const channelId = typeof req.params.channelId === "string" ? req.params.channelId : "";
    const body = req.body as { name?: unknown; memberIds?: unknown };
    const name = typeof body.name === "string" ? body.name : "";
    const memberIds = Array.isArray(body.memberIds) ? (body.memberIds as string[]) : [];

    // Authorization: only a group ADMIN may update the channel.
    if (!(await this.channelsService.isChannelAdmin(authUserId, channelId))) {
      throw new HttpException(403, "Only group admins can update this channel.");
    }

    const channel = await this.channelsService.updateGroupChannel(authUserId, channelId, {
      name,
      memberIds,
    });

    this.sendSuccess(res, channel, "Group channel updated successfully");
  };
}
