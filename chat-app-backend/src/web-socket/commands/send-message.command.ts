import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import { ChannelsService } from "@/modules/channel/channels.service";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";

interface SendMessagePayload {
  content: string;
  channelId: string;
  clientId: string;
}

@injectable()
export class SendMessageCommand implements WebSocketCommand {
  public readonly eventName = "send_message";

  constructor(
    @inject(TYPES.MessagesService) private messagesService: MessagesService,
    @inject(TYPES.ChannelsService) private channelsService: ChannelsService,
    @inject(TYPES.WebSocketBroadcaster) private broadcaster: WebSocketBroadcaster,
  ) {}

  public async execute(socket: Socket, authId: string, data: SendMessagePayload): Promise<void> {
    const targetChannelId = parseInt(data.channelId, 10);

    // 1. Persist to Database
    const savedMessage = await this.messagesService.saveMessage({
      content: data.content,
      channelId: targetChannelId,
      authorId: authId,
    });

    // 2. Update Channel
    await this.channelsService.updateChannel(targetChannelId);

    const broadcastPayload = {
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
    };

    // 3. Emits to everyone in the room (including the sender instance)
    await this.broadcaster.emitToRoom(data.channelId, "receive_message", broadcastPayload);
    await this.broadcaster.emitToRoom(data.channelId, "inbox_updated", null);
  }
}
