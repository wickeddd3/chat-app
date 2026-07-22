jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

import { PresencePruneWorker } from "@/services/presence-prune.worker";
import type { PresenceService, ExpiredPresence } from "@/services/presence.service";
import type { BroadcasterService } from "@/services/broadcaster.service";
import type { AuthRepository } from "@/modules/auth/persistence/auth.repository";

const TS = 1_700_000_000_000; // fixed eviction time for deterministic ISO assertions
const expired = (userId: string): ExpiredPresence => ({ userId, lastSeen: TS });
const offline = (userId: string) => ({ userId, status: "offline", lastSeen: new Date(TS).toISOString() });

describe("PresencePruneWorker", () => {
  let presence: { pruneExpiredUsers: jest.Mock; getFollowers: jest.Mock };
  let broadcaster: { emitToUser: jest.Mock };
  let authRepository: { updateLastSeen: jest.Mock };
  let worker: PresencePruneWorker;

  beforeEach(() => {
    presence = { pruneExpiredUsers: jest.fn(), getFollowers: jest.fn() };
    broadcaster = { emitToUser: jest.fn().mockResolvedValue(undefined) };
    authRepository = { updateLastSeen: jest.fn().mockResolvedValue(undefined) };
    worker = new PresencePruneWorker(
      presence as unknown as PresenceService,
      broadcaster as unknown as BroadcasterService,
      authRepository as unknown as AuthRepository,
    );
  });

  it("does nothing when no leases have lapsed", async () => {
    presence.pruneExpiredUsers.mockResolvedValue([]);

    await worker.runOnce();

    expect(authRepository.updateLastSeen).not.toHaveBeenCalled();
    expect(presence.getFollowers).not.toHaveBeenCalled();
    expect(broadcaster.emitToUser).not.toHaveBeenCalled();
  });

  it("persists last-seen once for the whole batch of evicted users", async () => {
    presence.pruneExpiredUsers.mockResolvedValue([expired("u1"), expired("u2")]);
    presence.getFollowers.mockResolvedValue([]);

    await worker.runOnce();

    expect(authRepository.updateLastSeen).toHaveBeenCalledTimes(1);
    expect(authRepository.updateLastSeen).toHaveBeenCalledWith(["u1", "u2"], expect.any(Date));
  });

  it("broadcasts an offline delta with last-seen to each observer of every evicted user", async () => {
    presence.pruneExpiredUsers.mockResolvedValue([expired("u1"), expired("u2")]);
    presence.getFollowers.mockImplementation((id: string) => Promise.resolve(id === "u1" ? ["a", "b"] : ["c"]));

    await worker.runOnce();

    expect(broadcaster.emitToUser).toHaveBeenCalledWith("a", "connection:status_change", offline("u1"));
    expect(broadcaster.emitToUser).toHaveBeenCalledWith("b", "connection:status_change", offline("u1"));
    expect(broadcaster.emitToUser).toHaveBeenCalledWith("c", "connection:status_change", offline("u2"));
    expect(broadcaster.emitToUser).toHaveBeenCalledTimes(3);
  });

  it("runOnce propagates failures so the cron process can exit non-zero", async () => {
    presence.pruneExpiredUsers.mockRejectedValue(new Error("redis down"));

    await expect(worker.runOnce()).rejects.toThrow("redis down");
  });

  // tick() is the private interval-mode wrapper; drive it directly for
  // deterministic assertions (no fake-timer plumbing).
  const tick = () => (worker as unknown as { tick(): Promise<void> }).tick();

  it("tick swallows failures so the interval keeps ticking", async () => {
    presence.pruneExpiredUsers.mockRejectedValue(new Error("redis down"));

    await expect(tick()).resolves.toBeUndefined();
  });

  it("tick does not re-enter an in-flight sweep", async () => {
    let release!: () => void;
    presence.pruneExpiredUsers.mockReturnValue(
      new Promise<ExpiredPresence[]>((resolve) => {
        release = () => resolve([]);
      }),
    );

    const first = tick(); // starts, parks on the unresolved prune
    await tick(); // should short-circuit while the first is in flight

    expect(presence.pruneExpiredUsers).toHaveBeenCalledTimes(1);

    release();
    await first;
  });
});
