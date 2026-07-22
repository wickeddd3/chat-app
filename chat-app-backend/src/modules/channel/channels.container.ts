import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { ChannelsRouter } from "./channels.router";
import { ChannelsController } from "./channels.controller";
import { ChannelsService } from "./channels.service";
import { ChannelsRepository } from "./persistence/channels.repository";
import { ChannelsQuery } from "./persistence/channels.query";
import { ChannelMembersRepository } from "./persistence/channel-members.repository";

export const channelsModule = new ContainerModule(({ bind }) => {
  bind<ChannelsRouter>(TYPES.ChannelsRouter).to(ChannelsRouter);
  bind<ChannelsController>(TYPES.ChannelsController).to(ChannelsController);
  bind<ChannelsService>(TYPES.ChannelsService).to(ChannelsService);
  // Persistence split by concern: channel-row writes, inbox/list reads, and the
  // channel_member table (guards + membership writes).
  bind<ChannelsRepository>(TYPES.ChannelsRepository).to(ChannelsRepository);
  bind<ChannelsQuery>(TYPES.ChannelsQuery).to(ChannelsQuery);
  bind<ChannelMembersRepository>(TYPES.ChannelMembersRepository).to(ChannelMembersRepository);
});
