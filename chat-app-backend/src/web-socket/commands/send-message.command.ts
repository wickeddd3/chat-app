import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import { ChannelsService } from "@/modules/channel/channels.service";
import type { Socket } from "socket.io";
import type { User } from "@/prisma/client";

@injectable()
export class SendMessageCommand implements WebSocketCommand {
  public readonly eventName = "send_message";

  constructor(
    @inject(TYPES.MessagesService) private messagesService: MessagesService,
    @inject(TYPES.ChannelsService) private channelsService: ChannelsService,
  ) {}

  public async execute(socket: Socket, user: User, data: any): Promise<void> {
    // 1. Persist to Database
    const savedMessage = await this.messagesService.saveMessage({
      content: data.content,
      channelId: parseInt(data.channelId),
      authorId: user.id,
    });

    // 2. Update Channel
    await this.channelsService.updateChannel(parseInt(data.channelId));

    // 3. Broadcast the saved message to the room
    socket.to(data.channelId).emit("receive_message", {
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

    socket.to(data.channelId).emit("inbox_updated");
  }
}
