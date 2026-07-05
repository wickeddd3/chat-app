import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { ServiceIdentifier } from "inversify";
import { container } from "@/config/inversify.config";
import type { HttpRouter } from "@/interfaces/router.interface";
import { errorMiddleware } from "@/middlewares/error.middleware";

// errorMiddleware reads req.log (pino-http) on 5xx paths; the API tests don't
// install pino-http, so give it a no-op logger to keep those paths safe.
const noopLog = { error: () => undefined, info: () => undefined, warn: () => undefined, debug: () => undefined };

/**
 * Builds a supertest-drivable Express app wired with the real routers resolved
 * from the DI container (real controllers/services/repositories → real DB) plus
 * the shared error middleware. The caller mocks `@/lib/jwt` (auth) and
 * `@/lib/redis` (so importing the container doesn't open a real connection).
 */
export function buildApiTestApp(routerIds: ServiceIdentifier<HttpRouter>[]): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { log: typeof noopLog }).log = noopLog;
    next();
  });

  for (const id of routerIds) {
    app.use(container.get<HttpRouter>(id).router);
  }

  app.use(errorMiddleware);
  return app;
}
