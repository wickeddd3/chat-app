import { injectable, inject } from "inversify";
import { z } from "zod";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { ChannelsService } from "@/modules/channel/channels.service";
import { BroadcasterService } from "@/services/broadcaster.service";
import { PresenceService } from "@/services/presence.service";

const typingSchema = z.object({
  channelId: z.uuid(),
  isTyping: z.boolean(),
});
type TypingPayload = z.infer<typeof typingSchema>;

/**
 * Relays an ephemeral "is typing" signal to the rest of a channel. Nothing is
 * persisted — the state lives only for as long as the receiving clients keep it
 * alive, so a dropped "stop" simply expires on their side.
 */
@injectable()
export class TypingCommand implements WebSocketCommand<TypingPayload> {
  public readonly eventName = "message:typing";
  public readonly schema = typingSchema;

  constructor(
    @inject(TYPES.ChannelsService) private channelsService: ChannelsService,
    @inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService,
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
  ) {}

  public async execute(socket: Socket, authId: string, data: TypingPayload): Promise<void> {
    const targetChannelId = data.channelId;

    // Resolve the roster and the authorization check in one pass: typing fires
    // far more often than sends, so the hot Redis set doubles as the membership
    // proof and only a cold cache pays for a database round-trip.
    let memberIds = await this.presenceService.getChannelMembersLookup(targetChannelId);
    if (memberIds.length === 0) {
      // Scoped to channels the requester belongs to — a non-member gets [].
      memberIds = await this.channelsService.getMemberIds(authId, targetChannelId);
      if (memberIds.length > 0) {
        await this.presenceService.setChannelMembersLookup(targetChannelId, memberIds);
      }
    }

    if (!memberIds.includes(authId)) {
      socket.emit("error", {
        code: "FORBIDDEN",
        event: this.eventName,
        message: "You are not a member of this channel.",
      });
      return;
    }

    const payload = { channelId: targetChannelId, userId: authId, isTyping: data.isTyping };

    // Everyone but the typist — echoing it back would make the sender see themselves.
    await Promise.all(
      memberIds
        .filter((memberId) => memberId !== authId)
        .map((memberId) => this.broadcaster.emitToUser(memberId, "message:typing_status", payload)),
    );
  }
}
