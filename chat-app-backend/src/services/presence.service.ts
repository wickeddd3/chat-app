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

  public async setPresenceLookup({ senderId, receiverId }: { senderId: string; receiverId: string }) {
    // Map structural graphs bi-directionally inside Redis
    // User A follows User B, and User B follows User A
    const pipeline = this.redis.pipeline();

    // Direct lookup contact sets
    pipeline.sadd(`presence:contacts:${senderId}`, receiverId);
    pipeline.sadd(`presence:contacts:${receiverId}`, senderId);

    // Reverse lookup observer tracking sets (who wants to know when I change state)
    pipeline.sadd(`presence:followers_of:${senderId}`, receiverId);
    pipeline.sadd(`presence:followers_of:${receiverId}`, senderId);

    await pipeline.exec();
  }

  /**
   * Compiles and resolves the complete localized viewport slice for a user using Redis Set Unions.
   */
  public async getAggregatedPresenceMap(authUserId: string): Promise<Record<string, "online" | "offline">> {
    const unionKeys = [`presence:contacts:${authUserId}`];

    // 1. Extract all target IDs across contact arrays and room rosters in O(N)
    const targetedUserIds = await this.redis.sunion(...unionKeys);

    if (targetedUserIds.length === 0) return {};

    // 2. Query statuses instantly via an MGET batch pipeline
    const statusKeys = targetedUserIds.map((id) => `${this.leasePrefix}${id}`);
    const results = await this.redis.mget(...statusKeys);

    // 3. Assemble response payload dictionary
    const presenceMap: Record<string, "online" | "offline"> = {};
    targetedUserIds.forEach((id, index) => {
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
