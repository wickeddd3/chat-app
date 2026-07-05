import { injectable, inject } from "inversify";
import { z } from "zod";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import { ChannelsService } from "@/modules/channel/channels.service";
import { BroadcasterService } from "@/services/broadcaster.service";
import { PresenceService } from "@/services/presence.service";
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
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
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

    // 3. Fan-out to every channel member. Prefer the hot Redis member set; on a
    // cache miss (TTL'd / never warmed) fall back to the DB and re-warm it —
    // otherwise the message would be saved but delivered to nobody in realtime.
    let memberIds = await this.redis.smembers(`presence:channel_members:${targetChannelId}`);
    if (memberIds.length === 0) {
      memberIds = await this.channelsService.getMemberIds(authId, targetChannelId);
      await this.presenceService.setChannelMembersLookup(targetChannelId, memberIds);
    }

    // Emit concurrently rather than serially blocking the sender's request.
    await Promise.all(
      memberIds.map((memberId) =>
        this.broadcaster.emitToUser(memberId, "message:receive_message", {
          channelPayload: {
            channelId: targetChannelId,
            lastMessage: {
              content: savedMessage.content,
              createdAt: savedMessage.createdAt,
            },
          },
          messagePayload: broadcastPayload,
        }),
      ),
    );
  }
}
