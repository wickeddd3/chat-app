import { injectable } from "inversify";
import { z } from "zod";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { createLogger } from "@/lib/logger";
import type { Socket } from "socket.io";

const log = createLogger("WebSocket");

const joinChannelSchema = z.object({ channelId: z.uuid() });
type JoinChannelPayload = z.infer<typeof joinChannelSchema>;

@injectable()
export class JoinChannelCommand implements WebSocketCommand<JoinChannelPayload> {
  public readonly eventName = "channel:join_channel";
  public readonly schema = joinChannelSchema;

  public async execute(socket: Socket, authId: string, data: JoinChannelPayload): Promise<void> {
    const { channelId } = data;
    log.debug({ authId, channelId }, "User joined channel");
    await socket.join(channelId);
  }
}
