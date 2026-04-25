import { PORT } from "@/config/app.config";
import { validateEnv } from "@/lib/validate-env";
import { App } from "@/app";
import { UsersController } from "@/modules/user/users.controller";

validateEnv();

const app = new App([new UsersController()], PORT);

app.start();
