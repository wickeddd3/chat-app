import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { MessagesRouter } from "./messages.router";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";
import { MessagesRepository } from "./messages.repository";

export const messagesModule = new ContainerModule(({ bind }) => {
  bind<MessagesRouter>(TYPES.MessagesRouter).to(MessagesRouter);
  bind<MessagesController>(TYPES.MessagesController).to(MessagesController);
  bind<MessagesService>(TYPES.MessagesService).to(MessagesService);
  bind<MessagesRepository>(TYPES.MessagesRepository).to(MessagesRepository);
});
