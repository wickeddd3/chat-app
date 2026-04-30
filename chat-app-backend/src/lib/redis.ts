import { REDIS_URL } from "@/config/app.config";
import { createClient } from "redis";

if (!REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

export const redisClient = createClient({ url: REDIS_URL });

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
};
