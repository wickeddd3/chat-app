import { redisClient } from "@/lib/redis";

export class PresenceService {
  private cacheDb = redisClient;

  public async refreshPresence(userId: string): Promise<void> {
    const ttlKey = `presence:active:${userId}`;
    const onlineSetKey = "presence:online_users";
    // Set/Update key with a 60-second expiration
    await this.cacheDb.set(ttlKey, "true", { EX: 60 });
    // Add to searchable online set
    await this.cacheDb.sAdd(onlineSetKey, userId);
  }

  public async removePresence(userId: string): Promise<void> {
    await this.cacheDb.del(`presence:active:${userId}`);
    await this.cacheDb.sRem("presence:online_users", userId);
  }
}
