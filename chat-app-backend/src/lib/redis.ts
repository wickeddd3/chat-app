import { REDIS_URL } from "@/config/app.config";
import { createLogger } from "@/lib/logger";
import { Redis } from "ioredis";

const log = createLogger("Redis");

const redisUrl = REDIS_URL;

// Existing presence/caching client
export const redisClient = new Redis(redisUrl);

// New isolated clients dedicated to horizontal WebSockets scaling
export const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
export const subClient = pubClient.duplicate();

export const connectRedis = async (): Promise<void> => {
  try {
    const clients = [
      { name: "Main Client", instance: redisClient },
      { name: "Pub Client", instance: pubClient },
      { name: "Sub Client", instance: subClient },
    ];

    for (const client of clients) {
      // Only call .connect() if the specific instance state is 'wait'
      if (client.instance.status === "wait") {
        await client.instance.connect();
        log.info(`📡 ${client.name} successfully connected`);
      } else {
        log.info(`ℹ️ ${client.name} bypasses manual trigger (Status: ${client.instance.status})`);
      }
    }
  } catch (error) {
    // Redis backs presence, pub/sub, and the websocket adapter — the app cannot
    // function without it, so fail fast rather than boot into a broken state.
    log.error({ err: error }, "Failed to connect to Redis infrastructure");
    throw error;
  }
};
