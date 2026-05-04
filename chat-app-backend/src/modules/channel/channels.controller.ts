import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import { type NextFunction, type Response, Router } from "express";
import { ChannelsService } from "./channels.service";
import { authMiddleware } from "@/middlewares/auth.middleware";
import HttpException from "@/utils/http.exception";
import { channelToChannelDetails, channelToInboxChannel } from "./channels.transformer";

export class ChannelsController implements Controller {
  public path = "/channels";
  public router = Router();
  private channelsService = new ChannelsService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/:channelId`, [authMiddleware], this.getChannel);
    this.router.get(`${this.path}`, [authMiddleware], this.getChannels);
  }

  private getChannel = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id || "";
      const channelId = req.params.channelId as string;
      const channel = await this.channelsService.getChannel(authUserId, parseInt(channelId));

      const transformedChannel = channel ? channelToChannelDetails(channel, authUserId) : null;
      res.status(200).json(transformedChannel);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve channels"));
    }
  };

  private getChannels = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req?.user?.id || "";
      const channels = await this.channelsService.getChannels(authUserId);

      const transformedChannels = channels.map((channel) => channelToInboxChannel(channel, authUserId));
      res.status(200).json(transformedChannels);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve channels"));
    }
  };
}
