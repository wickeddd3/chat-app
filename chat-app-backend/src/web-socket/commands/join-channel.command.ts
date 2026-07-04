import { injectable } from "inversify";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { createLogger } from "@/lib/logger";
import type { Socket } from "socket.io";

const log = createLogger("WebSocket");

interface JoinChannelPayload {
  channelId: string;
}

@injectable()
export class JoinChannelCommand implements WebSocketCommand {
  public readonly eventName = "channel:join_channel";

  public async execute(socket: Socket, authId: string, data: JoinChannelPayload): Promise<void> {
    const { channelId } = data;
    log.debug({ authId, channelId }, "User joined channel");
    await socket.join(channelId);
  }
}
