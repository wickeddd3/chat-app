import { PresenceService } from "@/services/presence.service";
import type { Redis } from "ioredis";

const TS = 1_700_000_000_000;

interface PipelineStub {
  del: jest.Mock;
  set: jest.Mock;
  zremrangebyscore: jest.Mock;
  exec: jest.Mock;
}

/** Chainable pipeline stub — every command returns the pipeline; exec resolves. */
function makePipeline(): PipelineStub {
  const pipeline: PipelineStub = {
    del: jest.fn(() => pipeline),
    set: jest.fn(() => pipeline),
    zremrangebyscore: jest.fn(() => pipeline),
    exec: jest.fn().mockResolvedValue([]),
  };
  return pipeline;
}

describe("PresenceService", () => {
  let redis: {
    sunion: jest.Mock;
    mget: jest.Mock;
    zrangebyscore: jest.Mock;
    pipeline: jest.Mock;
  };
  let service: PresenceService;
  let pipeline: PipelineStub;

  beforeEach(() => {
    pipeline = makePipeline();
    redis = {
      sunion: jest.fn(),
      mget: jest.fn(),
      zrangebyscore: jest.fn(),
      pipeline: jest.fn(() => pipeline),
    };
    service = new PresenceService(redis as unknown as Redis);
  });

  describe("getAggregatedPresenceMap", () => {
    it("returns status + last-seen, omitting the self id and marker", async () => {
      redis.sunion.mockResolvedValue(["u1", "u2", "EMPTY_MARKER", "me"]);
      // First mget is the status batch, second is the last-seen batch.
      redis.mget
        .mockResolvedValueOnce(["online", null]) // u1 online, u2 offline
        .mockResolvedValueOnce([null, String(TS)]); // u1 (n/a), u2 last-seen

      const map = await service.getAggregatedPresenceMap("me");

      expect(map).toEqual({
        u1: { status: "online", lastSeen: null },
        u2: { status: "offline", lastSeen: new Date(TS).toISOString() },
      });
    });

    it("returns an empty map when nobody is visible", async () => {
      redis.sunion.mockResolvedValue(["EMPTY_MARKER", "me"]);

      const map = await service.getAggregatedPresenceMap("me");

      expect(map).toEqual({});
      expect(redis.mget).not.toHaveBeenCalled();
    });
  });

  describe("pruneExpiredUsers", () => {
    it("stamps a last-seen key per evicted user and returns them with a timestamp", async () => {
      redis.zrangebyscore.mockResolvedValue(["u1", "u2"]);

      const result = await service.pruneExpiredUsers();

      expect(result).toEqual([
        { userId: "u1", lastSeen: expect.any(Number) },
        { userId: "u2", lastSeen: expect.any(Number) },
      ]);
      expect(pipeline.set).toHaveBeenCalledWith("presence:last_seen:u1", expect.any(String), "EX", expect.any(Number));
      expect(pipeline.set).toHaveBeenCalledWith("presence:last_seen:u2", expect.any(String), "EX", expect.any(Number));
      expect(pipeline.exec).toHaveBeenCalledTimes(1);
    });

    it("does nothing when no lease has lapsed", async () => {
      redis.zrangebyscore.mockResolvedValue([]);

      const result = await service.pruneExpiredUsers();

      expect(result).toEqual([]);
      expect(redis.pipeline).not.toHaveBeenCalled();
    });
  });
});
