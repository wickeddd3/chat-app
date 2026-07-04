import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { PresenceRouter } from "./presence.router";
import { PresenceController } from "./presence.controller";

export const presenceModule = new ContainerModule(({ bind }) => {
  bind<PresenceRouter>(TYPES.PresenceRouter).to(PresenceRouter);
  bind<PresenceController>(TYPES.PresenceController).to(PresenceController);
});
