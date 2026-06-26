import { injectable } from "inversify";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import type { Socket } from "socket.io";

interface JoinChannelPayload {
  channelId: string;
}

@injectable()
export class JoinChannelCommand implements WebSocketCommand {
  public readonly eventName = "channel:join_channel";

  public async execute(socket: Socket, authId: string, data: JoinChannelPayload): Promise<void> {
    const { channelId } = data;
    console.log(`User ${authId} join channel: ${channelId}`);
    await socket.join(channelId);
  }
}
