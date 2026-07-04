import { injectable } from "inversify";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { createLogger } from "@/lib/logger";
import type { Socket } from "socket.io";

const log = createLogger("WebSocket");

interface LeaveChannelPayload {
  channelId: string;
}

@injectable()
export class LeaveChannelCommand implements WebSocketCommand {
  public readonly eventName = "channel:leave_channel";

  public async execute(socket: Socket, authId: string, data: LeaveChannelPayload): Promise<void> {
    const { channelId } = data;
    log.debug({ authId, channelId }, "User left channel");
    await socket.leave(channelId);
  }
}
