import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { ChannelsController } from "./channels.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class ChannelsRouter implements HttpRouter {
  public path = "/channels";
  public router = Router();

  constructor(@inject(TYPES.ChannelsController) private channelsController: ChannelsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, [authMiddleware], this.channelsController.getChannels);

    this.router.get(`${this.path}/:channelId`, [authMiddleware], this.channelsController.getChannel);

    this.router.get(`${this.path}/find/:targetUserId`, [authMiddleware], this.channelsController.findChannelOrCreate);

    this.router.post(`${this.path}/group`, [authMiddleware], this.channelsController.createGroupChannel);

    this.router.post(`${this.path}/group/:channelId`, [authMiddleware], this.channelsController.updateGroupChannel);
  }
}
