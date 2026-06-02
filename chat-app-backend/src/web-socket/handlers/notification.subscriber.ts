import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Notification } from "@/prisma/client";
import notepack from "notepack.io";
import type { Redis } from "ioredis";

@injectable()
export class NotificationSubscriber {
  constructor(@inject(TYPES.RedisClient) private pubClient: Redis) {}

  /**
   * Orchestrates the direct serialization into the raw Socket.io Redis adapter format
   */
  public handleNotificationCreated = async (notification: Notification): Promise<void> => {
    try {
      const targetRoom = `user:${notification.userId}`;

      // Build the raw Engine.io protocol packet representation
      const packet = [
        Date.now().toString(), // Unique message session ID (can be any string)
        {
          type: 2, // Packet type (2 = EVENT in engine.io protocol)
          nsp: "/", // Namespace
          data: ["new_notification", notification], // [Event Name, Data Arguments]
        },
        {
          rooms: [targetRoom], // Target rooms collection array
          flags: {}, // Optional flags wrapper object
        },
      ];

      // Encode the protocol mapping package structure to binary MessagePack format
      const binaryPayload = notepack.encode(packet) as Buffer;

      // Publish directly into the Socket.io adapter cluster bus channel
      await this.pubClient.publish("socket.io#/#", binaryPayload);
    } catch (error) {
      console.error("Failed to execute real-time broadcast worker mapping:", error);
    }
  };
}
