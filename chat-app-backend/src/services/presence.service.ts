import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Redis } from "ioredis";

@injectable()
export class PresenceService {
  private readonly globalRegistryKey = "presence:global";
  private readonly leasePrefix = "presence:status:";

  constructor(@inject(TYPES.RedisMainClient) private redis: Redis) {}

  /**
   * Tracks an incoming heartbeat lease.
   * @returns "LOGIN" if the user was offline, "ALIVE" if they are already online.
   */
  public async trackHeartbeat(userId: string): Promise<"LOGIN" | "ALIVE"> {
    const timestamp = Date.now();
    const userLeaseKey = `${this.leasePrefix}${userId}`;

    // Check if user has an active lease right now
    const hasLease = await this.redis.exists(userLeaseKey);

    const pipeline = this.redis.pipeline();
    // Set a 60-second sliding window lease
    pipeline.set(userLeaseKey, "online", "EX", 60);
    // Add/update timestamp score in the sorted set
    pipeline.zadd(this.globalRegistryKey, timestamp, userId);

    await pipeline.exec();

    return hasLease === 1 ? "ALIVE" : "LOGIN";
  }

  /**
   * Generates a structural graph mapping block inside Redis.
   * Extends the lifespan of the graph with an explicit 24-hour TTL expiration.
   */
  public async setPresenceLookup(senderId: string, receiverId: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Direct lookup contact sets
    pipeline.sadd(`presence:contacts:${senderId}`, receiverId);
    pipeline.sadd(`presence:contacts:${receiverId}`, senderId);

    // Reverse lookup observer tracking sets
    pipeline.sadd(`presence:followers_of:${senderId}`, receiverId);
    pipeline.sadd(`presence:followers_of:${receiverId}`, senderId);

    // Give graphs a sliding window expiration so stale/dead connections evict naturally
    pipeline.expire(`presence:contacts:${senderId}`, 86400);
    pipeline.expire(`presence:contacts:${receiverId}`, 86400);
    pipeline.expire(`presence:followers_of:${senderId}`, 86400);
    pipeline.expire(`presence:followers_of:${receiverId}`, 86400);

    await pipeline.exec();
  }

  /**
   * Seeds an empty placeholder marker into Redis to protect against Cache Stampedes.
   */
  public async setEmptyPresenceMarker(userId: string): Promise<void> {
    await this.redis.sadd(`presence:contacts:${userId}`, "EMPTY_MARKER");
    await this.redis.expire(`presence:contacts:${userId}`, 3600); // Check again in 1 hour
  }

  /**
   * Returns null if the underlying key graph does not exist in cache memory.
   */
  public async getAggregatedPresenceMap(authUserId: string): Promise<Record<string, "online" | "offline"> | null> {
    const contactKey = `presence:contacts:${authUserId}`;

    // 1. Check if the graph exists in memory at all
    const exists = await this.redis.exists(contactKey);
    if (!exists) {
      return null; // Return explicit null signaling a cache-miss recovery state to the controller
    }

    // 2. Fetch the target identifiers from the Redis Set
    const targetedUserIds = await this.redis.smembers(contactKey);

    // Filter out markers immediately or return empty collection safely
    const cleanUserIds = targetedUserIds.filter((id) => id !== "EMPTY_MARKER");
    if (cleanUserIds.length === 0) return {};

    // 3. Query statuses via an MGET batch pipeline
    const statusKeys = cleanUserIds.map((id) => `${this.leasePrefix}${id}`);
    const results = await this.redis.mget(...statusKeys);

    // 4. Assemble response payload dictionary
    const presenceMap: Record<string, "online" | "offline"> = {};
    cleanUserIds.forEach((id, index) => {
      presenceMap[id] = results[index] === "online" ? "online" : "offline";
    });

    return presenceMap;
  }

  /**
   * Prunes missed heartbeats. Run this via a cron or a periodic background worker.
   */
  public async pruneExpiredUsers(): Promise<string[]> {
    const deadzone = Date.now() - 60000; // Missed heartbeat threshold (60s)

    // Fetch everyone who hasn't sent a heartbeat within the last minute
    const expiredUserIds = await this.redis.zrangebyscore(this.globalRegistryKey, "-inf", deadzone);

    if (expiredUserIds.length > 0) {
      const pipeline = this.redis.pipeline();
      // Clear out string leases just in case, and remove from sorted set
      expiredUserIds.forEach((id) => pipeline.del(`${this.leasePrefix}${id}`));
      pipeline.zremrangebyscore(this.globalRegistryKey, "-inf", deadzone);

      await pipeline.exec();
    }

    return expiredUserIds;
  }
}
