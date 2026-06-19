import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Redis } from "ioredis";

@injectable()
export class PresenceService {
  private readonly globalRegistryKey = "presence:global";
  private readonly leasePrefix = "presence:status:";
  private readonly contactPrefix = "presence:contacts:";
  private readonly followersPrefix = "presence:followers_of:";
  private readonly channelPrefix = "presence:channel_members:";

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
    pipeline.sadd(`${this.contactPrefix}${senderId}`, receiverId);
    pipeline.sadd(`${this.contactPrefix}${receiverId}`, senderId);

    // Reverse lookup observer tracking sets
    pipeline.sadd(`${this.followersPrefix}${senderId}`, receiverId);
    pipeline.sadd(`${this.followersPrefix}${receiverId}`, senderId);

    // Give graphs a sliding window expiration so stale/dead connections evict naturally
    pipeline.expire(`${this.contactPrefix}${senderId}`, 86400);
    pipeline.expire(`${this.contactPrefix}${receiverId}`, 86400);
    pipeline.expire(`${this.followersPrefix}${senderId}`, 86400);
    pipeline.expire(`${this.followersPrefix}${receiverId}`, 86400);

    await pipeline.exec();
  }

  /**
   * Seeds/Updates the full roster mapping of a channel inside Redis.
   */
  public async setChannelMembersLookup(channelId: string, memberIds: string[]): Promise<void> {
    if (memberIds.length === 0) return;

    const key = `${this.channelPrefix}${channelId}`;
    const pipeline = this.redis.pipeline();

    pipeline.sadd(key, ...memberIds);
    pipeline.expire(key, 86400); // 24-hour retention window

    // Crucial Strategy: Also cross-register everyone in the channel to watch each other.
    // This ensures when an off-screen member logs on, your WebSocket command knows to notify this channel's room.
    memberIds.forEach((memberId) => {
      pipeline.sadd(`${this.followersPrefix}${memberId}`, ...memberIds);
      pipeline.expire(`${this.followersPrefix}${memberId}`, 86400);
    });

    await pipeline.exec();
  }

  /**
   * Checks if a channel cache exists in Redis memory.
   */
  public async checkChannelCacheExists(channelId: string): Promise<boolean> {
    const result = await this.redis.exists(`${this.channelPrefix}${channelId}`);
    return result === 1;
  }

  /**
   * Seeds an empty placeholder marker into Redis to protect against Cache Stampedes.
   */
  public async setEmptyPresenceMarker(userId: string): Promise<void> {
    await this.redis.sadd(`${this.contactPrefix}${userId}`, "EMPTY_MARKER");
    await this.redis.expire(`${this.contactPrefix}${userId}`, 3600); // Check again in 1 hour
  }

  /**
   * Compiles the complete visible presence viewport map for a user.
   * Dynamically merges their contact list with an optional array of active channel rosters.
   * Returns null if the user's primary contact graph key is entirely missing.
   */
  public async getAggregatedPresenceMap(
    authUserId: string,
    activeChannelIds: string[] = [],
  ): Promise<Record<string, "online" | "offline">> {
    const contactKey = `${this.contactPrefix}${authUserId}`;

    // Prepare our key collection for Redis Set Union (SUNION)
    const unionKeys = [contactKey];

    activeChannelIds.forEach((channelId) => {
      unionKeys.push(`${this.channelPrefix}${channelId}`);
    });

    // 1. Gather all unique user IDs across contacts and channel members simultaneously in O(N)
    const targetedUserIds = await this.redis.sunion(...unionKeys);

    // Filter out metadata marker states safely
    const cleanUserIds = targetedUserIds.filter((id) => id !== "EMPTY_MARKER" && id !== authUserId);
    if (cleanUserIds.length === 0) return {};

    // 2. Query statuses instantly via an MGET batch pipeline
    const statusKeys = cleanUserIds.map((id) => `${this.leasePrefix}${id}`);
    const results = await this.redis.mget(...statusKeys);

    // 3. Assemble response payload dictionary
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
