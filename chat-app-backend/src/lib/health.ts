import { Router, type Request, type Response } from "express";
import { prisma } from "@/lib/prisma";
import { redisClient } from "@/lib/redis";

/**
 * Liveness + readiness probes for load balancers / orchestrators.
 *
 * - `/health` (liveness): is the process up? Dependency-free so a transient DB
 *   or Redis blip never triggers a container restart.
 * - `/ready` (readiness): can we serve traffic *right now*? Fails (503) while
 *   shutting down or when a dependency is unreachable, so the LB drains us.
 */
export function createHealthRouter(isShuttingDown: () => boolean): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  router.get("/ready", async (_req: Request, res: Response) => {
    if (isShuttingDown()) {
      res.status(503).json({ status: "shutting_down" });
      return;
    }

    const checks = { database: false, redis: false };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      /* leave database check false */
    }

    try {
      await redisClient.ping();
      checks.redis = true;
    } catch {
      /* leave redis check false */
    }

    const ready = checks.database && checks.redis;
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
