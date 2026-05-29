import { pubClient } from "@/lib/redis";
import type { Notification } from "@/prisma/client";
import notepack from "notepack.io";

export async function notificationCreated(notification: Notification) {
  try {
    const targetRoom = `user:${notification.userId}`;

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

    // Encode to custom binary format buffer
    const binaryPayload = notepack.encode(packet);

    await pubClient.publish("socket.io#/#", binaryPayload);
  } catch (error) {
    console.error("Failed to execute real-time broadcast worker mapping:", error);
  }
}
