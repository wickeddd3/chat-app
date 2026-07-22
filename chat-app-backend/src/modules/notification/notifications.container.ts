import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { NotificationsRouter } from "./notifications.router";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsRepository } from "./persistence/notifications.repository";
import { NotificationsQuery } from "./persistence/notifications.query";

export const notificationsModule = new ContainerModule(({ bind }) => {
  bind<NotificationsRouter>(TYPES.NotificationsRouter).to(NotificationsRouter);
  bind<NotificationsController>(TYPES.NotificationsController).to(NotificationsController);
  bind<NotificationsService>(TYPES.NotificationsService).to(NotificationsService);
  // Persistence split by read/write: the repository owns notification writes
  // (the table's single owner); the query owns the feed + unread count.
  bind<NotificationsRepository>(TYPES.NotificationsRepository).to(NotificationsRepository);
  bind<NotificationsQuery>(TYPES.NotificationsQuery).to(NotificationsQuery);
});
