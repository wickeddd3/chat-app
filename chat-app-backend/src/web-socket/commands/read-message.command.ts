import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import { MessageReceiptsService } from "@/modules/message-receipt/message-receipts.service";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";

interface ReadMessagePayload {
  channelId: string;
}

@injectable()
export class ReadMessageCommand implements WebSocketCommand {
  public readonly eventName = "mark_as_read";

  constructor(
    @inject(TYPES.MessagesService) private messagesService: MessagesService,
    @inject(TYPES.MessageReceiptsService) private messageReceiptsService: MessageReceiptsService,
    @inject(TYPES.WebSocketBroadcaster) private broadcaster: WebSocketBroadcaster,
  ) {}

  public async execute(socket: Socket, authId: string, data: ReadMessagePayload): Promise<void> {
    const targetChannelId = parseInt(data.channelId, 10);

    // 1. Find all messages in this channel NOT authored by the user
    // and NOT already read by the user
    const unreadMessages = await this.messagesService.getUnreadMessages(targetChannelId, authId);
    const unreadMessagesIds = unreadMessages.map((m) => m.id);

    if (unreadMessages.length > 0) {
      // 2. Bulk create receipts
      await this.messageReceiptsService.createMessageReceipts(authId, unreadMessagesIds);
    }

    // 3. Tell the user's frontend to clear the badge locally
    // socket.emit("unread_cleared", { channelId });
    // await this.broadcaster.emitToRoom(data.channelId, "inbox_updated", null);
  }
}
