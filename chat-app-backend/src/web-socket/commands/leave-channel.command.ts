import { injectable } from "inversify";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import type { Socket } from "socket.io";

interface LeaveChannelPayload {
  channelId: string;
}

@injectable()
export class LeaveChannelCommand implements WebSocketCommand {
  public readonly eventName = "channel:leave_channel";

  public async execute(socket: Socket, authId: string, data: LeaveChannelPayload): Promise<void> {
    const { channelId } = data;
    console.log(`User ${authId} left channel: ${channelId}`);
    await socket.leave(channelId);
  }
}
