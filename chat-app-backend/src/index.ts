import "dotenv/config";
import "reflect-metadata";
import { validateEnv } from "@/lib/validate-env";
import { PORT } from "@/config/app.config";
import { App } from "@/app";
import { container } from "@/config/inversify.config";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";

validateEnv();

// Dynamically resolve routers out from central DI container instance
const activeRouters: HttpRouter[] = [
  container.get<HttpRouter>(TYPES.AuthRouter),
  container.get<HttpRouter>(TYPES.UsersRouter),
  container.get<HttpRouter>(TYPES.ChannelsRouter),
  container.get<HttpRouter>(TYPES.MessagesRouter),
  container.get<HttpRouter>(TYPES.ConnectionsRouter),
  container.get<HttpRouter>(TYPES.NotificationsRouter),
  container.get<HttpRouter>(TYPES.PresenceRouter),
  container.get<HttpRouter>(TYPES.StatsRouter),
];

const app = new App(activeRouters, PORT);
app.start();
