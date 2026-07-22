import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { UsersRouter } from "./users.router";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersQuery } from "./persistence/users.query";

export const usersModule = new ContainerModule(({ bind }) => {
  bind<UsersRouter>(TYPES.UsersRouter).to(UsersRouter);
  bind<UsersController>(TYPES.UsersController).to(UsersController);
  bind<UsersService>(TYPES.UsersService).to(UsersService);
  // The user module is read-only (users are created via Supabase auth).
  bind<UsersQuery>(TYPES.UsersQuery).to(UsersQuery);
});
