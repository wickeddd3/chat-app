import { injectable } from "inversify";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import type { Socket } from "socket.io";
import type { User } from "@/prisma/client";

@injectable()
export class JoinChannelCommand implements WebSocketCommand {
  public readonly eventName = "join_channel";

  public async execute(socket: Socket, user: User, data: any): Promise<void> {
    const { channelId } = data;
    console.log(`User ${user.id} join channel: ${channelId}`);
    socket.join(channelId);
  }
}
