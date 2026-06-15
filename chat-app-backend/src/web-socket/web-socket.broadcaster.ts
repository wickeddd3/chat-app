import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Redis } from "ioredis";
import notepack from "notepack.io";

@injectable()
export class WebSocketBroadcaster {
  constructor(@inject(TYPES.RedisClient) private pubClient: Redis) {}

  /**
   * Publishes a raw Engine.io packet directly to the Redis Inter-process Communication (IPC) bus.
   * This instantly communicates with all cluster nodes without passing through a local Socket instance.
   */
  private async publishRaw(room: string, eventName: string, payload: unknown): Promise<void> {
    try {
      // Build the raw Engine.io protocol packet representation
      const packet = [
        Date.now().toString(), // Unique payload execution transaction ID
        {
          type: 2, // Engine.io EVENT token identifier. Packet type (2 = EVENT in engine.io protocol)
          nsp: "/", // Default root Namespace configuration
          data: [eventName, payload], // [Event Name, Data Arguments]
        },
        {
          rooms: [room], // Target rooms collection array
          flags: {}, // Optional flags wrapper object
        },
      ];

      // Encode the protocol mapping package structure to binary MessagePack format
      const binaryPayload = notepack.encode(packet) as Buffer;

      // Publish directly into the Socket.io adapter cluster bus channel
      await this.pubClient.publish("socket.io#/#", binaryPayload);
    } catch (error) {
      console.error(`❌ IPC Cluster Publish Failed for event [${eventName}]:`, error);
    }
  }

  public async emitToUser(userId: string, eventName: string, payload: unknown): Promise<void> {
    await this.publishRaw(`user:${userId}`, eventName, payload);
  }

  public async emitToRoom(roomId: string, eventName: string, payload: unknown): Promise<void> {
    await this.publishRaw(roomId, eventName, payload);
  }
}
