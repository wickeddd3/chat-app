import { injectable, inject } from "inversify";
import { z } from "zod";
import { TYPES } from "@/config/types";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { MessagesService } from "@/modules/message/messages.service";
import type { MessageWithAuthor } from "@/modules/message/messages.types";
import { ChannelsService } from "@/modules/channel/channels.service";
import { BroadcasterService } from "@/services/broadcaster.service";
import { PresenceService } from "@/services/presence.service";
import { NotFoundError, ValidationError } from "@/shared/errors/domain.error";
import { SUPABASE_URL } from "@/config/app.config";

/** The public Storage bucket the client uploads message photos into. */
const MESSAGE_IMAGE_BUCKET = "message-images";

/**
 * Only our own storage bucket may be attached.
 *
 * The client uploads direct-to-storage and sends back a URL, so without this an
 * arbitrary third-party URL could be attached and every member's client would
 * fetch it — turning a message into a tracking pixel that leaks their IP. The
 * prefix pins both the host and the bucket.
 */
const IMAGE_URL_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${MESSAGE_IMAGE_BUCKET}/`;

const sendMessageSchema = z
  .object({
    // Empty when a photo is sent without a caption; the service rejects a
    // message that carries neither text nor an image.
    content: z.string().max(4000),
    channelId: z.uuid(),
    clientId: z.string().min(1),
    // Present when this message quotes another one. The service checks the target
    // is in the same channel before persisting.
    parentId: z.uuid().optional(),
    imageUrl: z.url().startsWith(IMAGE_URL_PREFIX).optional(),
    // Natural size, used to reserve the bubble's box before the image loads.
    imageWidth: z.int().positive().max(20000).optional(),
    imageHeight: z.int().positive().max(20000).optional(),
  })
  .refine((data) => data.content.trim().length > 0 || !!data.imageUrl, {
    message: "A message needs text or an image.",
    path: ["content"],
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

    // 0b. A direct channel outlives the connection that opened it — the history
    // stays readable after a contact is removed, but it stops taking new messages.
    if (!(await this.channelsService.canMessage(authId, targetChannelId))) {
      socket.emit("error", {
        code: "FORBIDDEN",
        event: this.eventName,
        message: "You can no longer message this user.",
      });
      return;
    }

    // 1. Persist to Database. A bad reply target is a client-correctable
    // failure, so report it back on this socket rather than letting the server's
    // catch-all turn it into an opaque "internal failure".
    let savedMessage: MessageWithAuthor;
    try {
      savedMessage = await this.messagesService.saveMessage({
        content: data.content,
        channelId: targetChannelId,
        authorId: authId,
        parentId: data.parentId ?? null,
        imageUrl: data.imageUrl ?? null,
        imageWidth: data.imageWidth ?? null,
        imageHeight: data.imageHeight ?? null,
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        socket.emit("error", { code: error.code, event: this.eventName, message: error.message });
        return;
      }
      throw error;
    }

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
      // Both travel: `parentId` so the client can jump to the original, `parent`
      // so it can draw the quote without it being loaded.
      parentId: savedMessage.parentId,
      parent: savedMessage.parent,
      imageUrl: savedMessage.imageUrl,
      imageWidth: savedMessage.imageWidth,
      imageHeight: savedMessage.imageHeight,
    };

    // 3. Fan-out to every channel member. Prefer the hot Redis member set; on a
    // cache miss (TTL'd / never warmed) fall back to the DB and re-warm it —
    // otherwise the message would be saved but delivered to nobody in realtime.
    let memberIds = await this.presenceService.getChannelMembersLookup(targetChannelId);
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
              hasImage: !!savedMessage.imageUrl,
            },
          },
          messagePayload: broadcastPayload,
        }),
      ),
    );
  }
}
