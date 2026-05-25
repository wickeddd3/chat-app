import { PORT } from "@/config/app.config";
import { validateEnv } from "@/lib/validate-env";
import { App } from "@/app";
import { UsersController } from "@/modules/user/users.controller";
import { ChannelsController } from "@/modules/channel/channels.controller";
import { MessagesController } from "@/modules/message/messages.controller";
import { ConnectionsController } from "./modules/connection/connections.controller";

validateEnv();

const app = new App(
  [new UsersController(), new ChannelsController(), new MessagesController(), new ConnectionsController()],
  PORT,
);

app.start();
