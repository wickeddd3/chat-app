import { PORT } from "@/config/app.config";
import { validateEnv } from "@/lib/validate-env";
import { App } from "@/app";

validateEnv();

const app = new App([], PORT);

app.start();
