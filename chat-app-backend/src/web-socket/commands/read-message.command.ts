import { injectable, inject } from "inversify";
import { z } from "zod";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import { MessageReceiptsService } from "@/modules/message-receipt/message-receipts.service";
import { ChannelsService } from "@/modules/channel/channels.service";
import { BroadcasterService } from "@/services/broadcaster.service";

const readMessageSchema = z.object({ channelId: z.uuid() });
type ReadMessagePayload = z.infer<typeof readMessageSchema>;

@injectable()
export class ReadMessageCommand implements WebSocketCommand<ReadMessagePayload> {
  public readonly eventName = "message:mark_as_read";
  // Schema guarantees a valid channelId — this also closes the old footgun where
  // a missing/undefined id made the unread query mark EVERY channel read.
  public readonly schema = readMessageSchema;

  constructor(
    @inject(TYPES.MessagesService) private messagesService: MessagesService,
    @inject(TYPES.MessageReceiptsService) private messageReceiptsService: MessageReceiptsService,
    @inject(TYPES.ChannelsService) private channelsService: ChannelsService,
    @inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService,
  ) {}

  public async execute(socket: Socket, authId: string, data: ReadMessagePayload): Promise<void> {
    const targetChannelId = data.channelId;

    // Authorization: only members may mark a channel's messages as read.
    if (!(await this.channelsService.isMember(authId, targetChannelId))) {
      socket.emit("error", {
        code: "FORBIDDEN",
        event: this.eventName,
        message: "You are not a member of this channel.",
      });
      return;
    }

    // 1. Find all messages in this channel NOT authored by the user
    // and NOT already read by the user
    const unreadMessages = await this.messagesService.getUnreadMessages(targetChannelId, authId);
    const unreadMessagesIds = unreadMessages.map((m) => m.id);

    let readMessageCount = 0;

    if (unreadMessages.length > 0) {
      // 2. Bulk create receipts
      const { count } = await this.messageReceiptsService.createMessageReceipts(authId, unreadMessagesIds);

      readMessageCount = count;
    }

    // 3. Tell the user's frontend to clear the badge locally
    await this.broadcaster.emitToUser(authId, "message:read", { channelId: targetChannelId, readMessageCount });
  }
}
