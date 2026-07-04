import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { AuthRouter } from "./auth.router";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";

export const authModule = new ContainerModule(({ bind }) => {
  bind<AuthRouter>(TYPES.AuthRouter).to(AuthRouter);
  bind<AuthController>(TYPES.AuthController).to(AuthController);
  bind<AuthService>(TYPES.AuthService).to(AuthService);
  bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository);
});
