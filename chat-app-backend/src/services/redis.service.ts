import { REDIS_URL } from "@/config/app.config";
import { createClient } from "redis";

export type RedisClientType = ReturnType<typeof createClient>;

export class RedisService {
  private client: RedisClientType | null;

  constructor() {
    this.client = null;
  }

  async start() {
    if (this.client) return;

    try {
      if (!REDIS_URL) {
        throw new Error("REDIS_URL is not defined");
      }

      this.client = createClient({
        url: REDIS_URL,
      });

      this.client.on("error", (error) => console.error("Redis client error", error));

      await this.client.connect();
      console.log("Redis connected");
    } catch (error) {
      console.error("Failed to initialize redis", error);
    }
  }
}
