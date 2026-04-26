import { PORT } from "@/config/app.config";
import { validateEnv } from "@/lib/validate-env";
import { App } from "@/app";
import { UsersController } from "@/modules/user/users.controller";
import { MessagesController } from "./modules/message/messages.controller";

validateEnv();

const app = new App([new UsersController(), new MessagesController()], PORT);

app.start();
