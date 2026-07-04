import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { ConnectionsRouter } from "./connections.router";
import { ConnectionsController } from "./connections.controller";
import { ConnectionsService } from "./connections.service";
import { ConnectionsRepository } from "./connections.repository";

export const connectionsModule = new ContainerModule(({ bind }) => {
  bind<ConnectionsRouter>(TYPES.ConnectionsRouter).to(ConnectionsRouter);
  bind<ConnectionsController>(TYPES.ConnectionsController).to(ConnectionsController);
  bind<ConnectionsService>(TYPES.ConnectionsService).to(ConnectionsService);
  bind<ConnectionsRepository>(TYPES.ConnectionsRepository).to(ConnectionsRepository);
});
