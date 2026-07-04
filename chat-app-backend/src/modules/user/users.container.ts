import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { UsersRouter } from "./users.router";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";

export const usersModule = new ContainerModule(({ bind }) => {
  bind<UsersRouter>(TYPES.UsersRouter).to(UsersRouter);
  bind<UsersController>(TYPES.UsersController).to(UsersController);
  bind<UsersService>(TYPES.UsersService).to(UsersService);
  bind<UsersRepository>(TYPES.UsersRepository).to(UsersRepository);
});
