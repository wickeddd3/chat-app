import { injectable, inject } from "inversify";
import { z } from "zod";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import { ChannelsService } from "@/modules/channel/channels.service";
import { BroadcasterService } from "@/services/broadcaster.service";
import type { Redis } from "ioredis";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  channelId: z.uuid(),
  clientId: z.string().min(1),
});
type SendMessagePayload = z.infer<typeof sendMessageSchema>;

@injectable()
export class SendMessageCommand implements WebSocketCommand<SendMessagePayload> {
  public readonly eventName = "message:send_message";
  public readonly schema = sendMessageSchema;

  constructor(
    @inject(TYPES.MessagesService) private messagesService: MessagesService,
    @inject(TYPES.ChannelsService) private channelsService: ChannelsService,
    @inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService,
    @inject(TYPES.RedisMainClient) private redis: Redis,
  ) {}

  public async execute(socket: Socket, authId: string, data: SendMessagePayload): Promise<void> {
    const targetChannelId = data.channelId;

    // 0. Authorization: only members may post to a channel.
    if (!(await this.channelsService.isMember(authId, targetChannelId))) {
      socket.emit("error", {
        code: "FORBIDDEN",
        event: this.eventName,
        message: "You are not a member of this channel.",
      });
      return;
    }

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

    // 3. AMBIENT BACKGROUND FAN-OUT: Fetch all members belonging to this channel
    const channelMemberIds = await this.redis.smembers(`presence:channel_members:${data.channelId}`);

    // Loop through members to update counts and trigger background cache invalidations
    for (const memberId of channelMemberIds) {
      // Notify the member's background socket layer across the server cluster
      await this.broadcaster.emitToUser(memberId, "message:receive_message", {
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
