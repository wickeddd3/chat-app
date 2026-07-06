import "dotenv/config";
import "reflect-metadata";
// Importing app.config validates the environment (cleanEnv) and fails fast.
import "@/config/app.config";
import { createLogger } from "@/lib/logger";
import { connectRedis, redisClient, pubClient, subClient } from "@/lib/redis";
import { container } from "@/config/inversify.config";
import { TYPES } from "@/config/types";
import { PresencePruneWorker } from "@/services/presence-prune.worker";

const log = createLogger("PresencePruneJob");

/**
 * Dedicated one-shot presence prune job, scheduled by an external cron (see
 * `prune:presence` in package.json). Runs a single sweep and exits.
 *
 * Deliberately lightweight: it only needs Redis (prune + follower lookups +
 * the broadcast bus). It never opens the HTTP server, the Socket.io server, or
 * Postgres — resolving just the worker from the container pulls in only the
 * PresenceService (main client) and BroadcasterService (pub client).
 *
 * Running this on a schedule means exactly one sweeper executes regardless of
 * how many web instances are deployed — no in-process interval, no redundant
 * sweeps, no distributed lock.
 */
async function main(): Promise<void> {
  await connectRedis();

  const worker = container.get<PresencePruneWorker>(TYPES.PresencePruneWorker);
  await worker.runOnce();
  log.info("✅ Presence prune job complete");

  // Close Redis so the process can exit cleanly instead of hanging on open
  // sockets. Publishes issued during the sweep have already been awaited.
  await Promise.allSettled([redisClient.quit(), pubClient.quit(), subClient.quit()]);
}

main()
  .then(() => {
    // eslint-disable-next-line n/no-process-exit -- intentional at job boundary
    process.exit(0);
  })
  .catch((error: unknown) => {
    // Non-zero exit lets the scheduler detect the failed run.
    log.error({ err: error }, "💥 Presence prune job failed");
    // eslint-disable-next-line n/no-process-exit -- intentional at job boundary
    process.exit(1);
  });
