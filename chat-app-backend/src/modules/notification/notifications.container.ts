import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { NotificationsRouter } from "./notifications.router";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsRepository } from "./notifications.repository";

export const notificationsModule = new ContainerModule(({ bind }) => {
  bind<NotificationsRouter>(TYPES.NotificationsRouter).to(NotificationsRouter);
  bind<NotificationsController>(TYPES.NotificationsController).to(NotificationsController);
  bind<NotificationsService>(TYPES.NotificationsService).to(NotificationsService);
  bind<NotificationsRepository>(TYPES.NotificationsRepository).to(NotificationsRepository);
});
