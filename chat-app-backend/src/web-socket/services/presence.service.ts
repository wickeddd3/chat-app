import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Redis } from "ioredis";

@injectable()
export class PresenceService {
  constructor(@inject(TYPES.RedisClient) private cacheDb: Redis) {}

  public async refreshPresence(userId: string): Promise<void> {
    const ttlKey = `presence:active:${userId}`;
    const onlineSetKey = "presence:online_users";

    await this.cacheDb.set(ttlKey, "true", "EX", 60);
    await this.cacheDb.sadd(onlineSetKey, userId);
  }

  public async removePresence(userId: string): Promise<void> {
    await this.cacheDb.del(`presence:active:${userId}`);
    await this.cacheDb.srem("presence:online_users", userId);
  }
}
