import "dotenv/config";
import "reflect-metadata";
// Importing app.config validates the environment (cleanEnv) and fails fast.
import { PORT } from "@/config/app.config";
import { App } from "@/app";
import { container } from "@/config/inversify.config";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";

// Dynamically resolve routers out from the central DI container instance.
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

async function main(): Promise<void> {
  const app = new App(activeRouters, PORT);
  await app.start();

  // Translate orchestrator/OS signals into a graceful shutdown.
  const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
  for (const signal of signals) {
    process.on(signal, () => {
      void app.shutdown(signal);
    });
  }

  // Last-resort guards: log and shut down rather than dying silently.
  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled promise rejection:", reason);
    void app.shutdown("unhandledRejection");
  });
  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught exception:", error);
    void app.shutdown("uncaughtException");
  });
}

main().catch((error: unknown) => {
  console.error("💥 Fatal error during startup:", error);
  // eslint-disable-next-line n/no-process-exit -- intentional at process boundary
  process.exit(1);
});
