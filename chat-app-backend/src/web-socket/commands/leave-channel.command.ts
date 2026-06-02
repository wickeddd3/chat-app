import { injectable } from "inversify";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import type { Socket } from "socket.io";
import type { User } from "@/prisma/client";

interface LeaveChannelPayload {
  channelId: string;
}

@injectable()
export class LeaveChannelCommand implements WebSocketCommand {
  public readonly eventName = "leave_channel";

  public async execute(socket: Socket, user: User, data: LeaveChannelPayload): Promise<void> {
    const { channelId } = data;
    console.log(`User ${user.id} left channel: ${channelId}`);
    await socket.leave(channelId);
  }
}
