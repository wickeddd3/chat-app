import { injectable } from "inversify";
import { z } from "zod";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { createLogger } from "@/lib/logger";
import type { Socket } from "socket.io";

const log = createLogger("WebSocket");

const leaveChannelSchema = z.object({ channelId: z.uuid() });
type LeaveChannelPayload = z.infer<typeof leaveChannelSchema>;

@injectable()
export class LeaveChannelCommand implements WebSocketCommand<LeaveChannelPayload> {
  public readonly eventName = "channel:leave_channel";
  public readonly schema = leaveChannelSchema;

  public async execute(socket: Socket, authId: string, data: LeaveChannelPayload): Promise<void> {
    const { channelId } = data;
    log.debug({ authId, channelId }, "User left channel");
    await socket.leave(channelId);
  }
}
