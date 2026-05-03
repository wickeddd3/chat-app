import { Event } from "@/interfaces/event.interface";
import { MessagesService } from "@/modules/message/messages.service";
import type { User } from "better-auth";
import type { Socket } from "socket.io";

export class SendMessageEvent implements Event {
  private messagesService = new MessagesService();
  private webSocketServer;

  constructor(webSocketServer: any) {
    this.webSocketServer = webSocketServer;
  }

  public async execute(socket: Socket, user: User, data: any) {
    try {
      // 1. Persist to Database
      const savedMessage = await this.messagesService.saveMessage({
        content: data.content,
        channelId: data.channelId,
        authorId: user.id,
      });
      // 2. Broadcast the saved message to the room
      this.webSocketServer.to(data.channelId).emit("receive_message", {
        clientId: data.clientId, // Echo back clientId for optimistic UI reconciliation
        id: savedMessage.id,
        content: savedMessage.content,
        channelId: savedMessage.channelId,
        author: {
          id: savedMessage.author.id,
          name: savedMessage.author.name,
          image: savedMessage.author.image,
        },
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      console.error("Failed to persist message:", error);
      socket.emit("error", { message: "Message could not be sent" });
    }
  }
}
