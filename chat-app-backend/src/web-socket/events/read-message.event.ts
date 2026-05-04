import { Event } from "@/interfaces/event.interface";
import { MessageReceiptsService } from "@/modules/message-receipt/message-receipts.service";
import { MessagesService } from "@/modules/message/messages.service";
import type { User } from "better-auth";
import type { Socket } from "socket.io";

export class ReadMessageEvent implements Event {
  private messagesService = new MessagesService();
  private messageReceiptsService = new MessageReceiptsService();
  private webSocketServer;

  constructor(webSocketServer: any) {
    this.webSocketServer = webSocketServer;
  }

  public async execute(socket: Socket, user: User, data: any) {
    try {
      const userId = user.id;
      const channelId = data.channelId;

      // 1. Find all messages in this channel NOT authored by the user
      // and NOT already read by the user
      const unreadMessages = await this.messagesService.getUnreadMessages(channelId, userId);
      const unreadMessagesIds = unreadMessages.map((m) => m.id);

      if (unreadMessages.length > 0) {
        // 2. Bulk create receipts
        await this.messageReceiptsService.createMessageReceipts(userId, unreadMessagesIds);
      }

      // 3. Tell the user's frontend to clear the badge locally
      // socket.emit("unread_cleared", { channelId });
      this.webSocketServer.to(data.channelId).emit("inbox_updated");
    } catch (error) {
      console.error("Failed to mark message as read:", error);
      socket.emit("error", { message: "Message could not be mark as read" });
    }
  }
}
