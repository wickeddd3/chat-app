import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { ConnectionsRouter } from "./connections.router";
import { ConnectionsController } from "./connections.controller";
import { ConnectionsService } from "./connections.service";
import { ConnectionsRepository } from "./persistence/connections.repository";
import { ConnectionsQuery } from "./persistence/connections.query";

export const connectionsModule = new ContainerModule(({ bind }) => {
  bind<ConnectionsRouter>(TYPES.ConnectionsRouter).to(ConnectionsRouter);
  bind<ConnectionsController>(TYPES.ConnectionsController).to(ConnectionsController);
  bind<ConnectionsService>(TYPES.ConnectionsService).to(ConnectionsService);
  // Persistence is split by read/write: the repository owns Connection mutations,
  // the query owns list projections. They share no code and change separately.
  bind<ConnectionsRepository>(TYPES.ConnectionsRepository).to(ConnectionsRepository);
  bind<ConnectionsQuery>(TYPES.ConnectionsQuery).to(ConnectionsQuery);
});
