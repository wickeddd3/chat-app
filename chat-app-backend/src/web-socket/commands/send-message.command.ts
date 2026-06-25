import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import { ChannelsService } from "@/modules/channel/channels.service";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";
import type { Redis } from "ioredis";

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
    @inject(TYPES.RedisMainClient) private redis: Redis,
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

    // 3. DIRECT FAN-OUT: Broadcast the full message payload to the active room.
    // Only clients currently inside this room room (via join_channel) will hear this.
    await this.broadcaster.emitToRoom(data.channelId, "receive_message", broadcastPayload);

    // 4. AMBIENT BACKGROUND FAN-OUT: Fetch all members belonging to this channel
    const channelMemberIds = await this.redis.smembers(`presence:channel_members:${data.channelId}`);

    // Loop through members to update counts and trigger background cache invalidations
    for (const memberId of channelMemberIds) {
      // Notify the member's background socket layer across the server cluster
      await this.broadcaster.emitToUser(memberId, "inbox_updated", {
        channelPayload: {
          channelId: data.channelId,
          lastMessage: {
            content: savedMessage.content,
            createdAt: savedMessage.createdAt,
          },
        },
        messagePayload: broadcastPayload,
      });
    }
  }
}
