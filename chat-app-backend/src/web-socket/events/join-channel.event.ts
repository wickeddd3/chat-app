import { Event } from "@/interfaces/event.interface";
import type { User } from "better-auth";
import type { Socket } from "socket.io";

export class JoinChannelEvent implements Event {
  public async execute(socket: Socket, user: User, data: any) {
    try {
      const { channelId } = data;
      console.log(`User ${user.id} join channel: ${channelId}`);
      socket.join(channelId);
    } catch (error) {
      console.error("Failed to join channel:", error);
      socket.emit("error", { message: "Failed to join channel" });
    }
  }
}
