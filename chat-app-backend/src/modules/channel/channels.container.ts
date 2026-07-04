import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { ChannelsRouter } from "./channels.router";
import { ChannelsController } from "./channels.controller";
import { ChannelsService } from "./channels.service";
import { ChannelsRepository } from "./channels.repository";

export const channelsModule = new ContainerModule(({ bind }) => {
  bind<ChannelsRouter>(TYPES.ChannelsRouter).to(ChannelsRouter);
  bind<ChannelsController>(TYPES.ChannelsController).to(ChannelsController);
  bind<ChannelsService>(TYPES.ChannelsService).to(ChannelsService);
  bind<ChannelsRepository>(TYPES.ChannelsRepository).to(ChannelsRepository);
});
