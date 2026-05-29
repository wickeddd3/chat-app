import { REDIS_URL } from "@/config/app.config";
import { Redis } from "ioredis";

const redisUrl = REDIS_URL || "";

// Existing presence/caching client
export const redisClient = new Redis(redisUrl);

// New isolated clients dedicated to horizontal WebSockets scaling
export const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
export const subClient = pubClient.duplicate();

export const connectRedis = async (): Promise<void> => {
  try {
    // Await primary service connections smoothly
    await Promise.all([redisClient.connect(), pubClient.connect(), subClient.connect()]);
    console.log("Redis cluster connection pools initialized successfully.");
  } catch (error) {
    console.error("Failed to connect to Redis infrastructure:", error);
  }
};
