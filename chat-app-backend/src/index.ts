import "reflect-metadata";
import { validateEnv } from "@/lib/validate-env";
import { PORT } from "@/config/app.config";
import { App } from "@/app";
import { container } from "@/config/inversify.config";
import { TYPES } from "@/config/types";
import { Controller } from "@/interfaces/controller.interface";

validateEnv();

// Dynamically resolve controllers out from central DI container instance
const activeControllers: Controller[] = [
  container.get<Controller>(TYPES.UsersController),
  container.get<Controller>(TYPES.ChannelsController),
  container.get<Controller>(TYPES.MessagesController),
  container.get<Controller>(TYPES.ConnectionsController),
  container.get<Controller>(TYPES.NotificationsController),
];

const app = new App(activeControllers, PORT);
app.start();
