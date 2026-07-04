import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { StatsRouter } from "./stats.router";
import { StatsController } from "./stats.controller";

export const statsModule = new ContainerModule(({ bind }) => {
  bind<StatsRouter>(TYPES.StatsRouter).to(StatsRouter);
  bind<StatsController>(TYPES.StatsController).to(StatsController);
});
