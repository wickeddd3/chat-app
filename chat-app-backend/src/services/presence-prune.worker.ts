import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PresenceService } from "@/services/presence.service";
import { BroadcasterService } from "@/services/broadcaster.service";
import { createLogger } from "@/lib/logger";

const log = createLogger("PresencePruneWorker");

// Sweep cadence. Lease TTL + deadzone is 60s and the client heartbeats every
// 30s, so a 30s interval detects a drop-off within ~one missed beat.
const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Closes the presence loop: evicts users whose heartbeat lease has lapsed and
 * broadcasts the resulting "offline" transition to their observers.
 *
 * Without this, `presence:global` accumulates stale ids forever and the
 * "online -> offline" delta is never emitted — the frontend would only learn a
 * user went offline on a full presence-snapshot refresh. The heartbeat command
 * already emits the "online" half of the state machine on LOGIN; this worker
 * supplies the missing "offline" half.
 *
 * Two ways to drive it, sharing the same `runOnce()` core:
 *  - `start()` runs it on an in-process interval — correct on a single web
 *    instance (e.g. the free tier), where there's exactly one sweeper.
 *  - `src/jobs/presence-prune.job.ts` calls `runOnce()` once from a dedicated
 *    scheduled process — use this for multi-instance deployments so exactly one
 *    sweeper runs (and do NOT also call `start()`, or you'd double-sweep).
 */
@injectable()
export class PresencePruneWorker {
  private timer: NodeJS.Timeout | null = null;
  // Guards against overlapping sweeps: a slow tick must not be re-entered by the
  // next interval firing before it has finished.
  private isSweeping = false;

  constructor(
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
    @inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService,
  ) {}

  /**
   * Starts the in-process periodic sweep. Idempotent — a second call is a no-op
   * while already running.
   */
  public start(intervalMs: number = DEFAULT_INTERVAL_MS): void {
    if (this.timer) return;

    this.timer = setInterval(() => void this.tick(), intervalMs);
    // Don't let the interval keep the event loop (and thus the process) alive on
    // its own during shutdown.
    this.timer.unref();

    log.info({ intervalMs }, "🧹 Presence prune worker started");

    // Sweep once immediately so stale ids left over from a previous run (or a
    // hard restart) are cleared at boot rather than lingering for a full interval.
    void this.tick();
  }

  /**
   * Stops the periodic sweep. Safe to call multiple times.
   */
  public stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    log.info("🛑 Presence prune worker stopped");
  }

  /**
   * Interval-safe wrapper around `runOnce()`: guards against overlapping sweeps
   * and never throws — a failure here must not crash the process or stop the
   * interval.
   */
  private async tick(): Promise<void> {
    if (this.isSweeping) return;
    this.isSweeping = true;
    try {
      await this.runOnce();
    } catch (error) {
      log.error({ err: error }, "Presence prune sweep failed");
    } finally {
      this.isSweeping = false;
    }
  }

  /**
   * Performs a single prune sweep: evict lapsed users, then fan out an "offline"
   * delta to each evicted user's observers.
   *
   * Broadcasts go through `BroadcasterService`, which publishes to the Redis
   * Socket.io adapter bus — so this works from a standalone process with no
   * local Socket.io server; the web instances deliver to their clients.
   *
   * Propagates errors so the standalone cron entrypoint can exit non-zero (the
   * interval wrapper `tick()` catches them instead).
   */
  public async runOnce(): Promise<void> {
    const expiredUserIds = await this.presenceService.pruneExpiredUsers();
    if (expiredUserIds.length === 0) return;

    for (const userId of expiredUserIds) {
      const observerIds = await this.presenceService.getFollowers(userId);
      const payload = { userId, status: "offline" };
      await Promise.all(
        observerIds.map((observerId) => this.broadcaster.emitToUser(observerId, "connection:status_change", payload)),
      );
    }

    log.info({ count: expiredUserIds.length, userIds: expiredUserIds }, "🧹 Pruned lapsed presence leases");
  }
}
