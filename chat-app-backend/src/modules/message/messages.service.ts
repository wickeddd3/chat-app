import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { MessagesRepository } from "./persistence/messages.repository";
import { MessagesQuery } from "./persistence/messages.query";
import { MessageReceiptsRepository } from "./persistence/message-receipts.repository";
import { NotFoundError, ValidationError } from "@/shared/errors/domain.error";
import type { MessageWithAuthor, PaginatedMessages, UnreadMessage } from "./messages.types";

/**
 * Message orchestration. Thin by nature — there are no cross-module writes or
 * state-transition rules here — so it delegates and lets domain errors propagate
 * rather than re-wrapping them as opaque 500s.
 *
 * Read receipts are a child of the message aggregate (a receipt is "user X read
 * message Y"), so they live in this module rather than a standalone one.
 */
@injectable()
export class MessagesService {
  constructor(
    @inject(TYPES.MessagesRepository) private messagesRepository: MessagesRepository,
    @inject(TYPES.MessagesQuery) private messagesQuery: MessagesQuery,
    @inject(TYPES.MessageReceiptsRepository) private messageReceiptsRepository: MessageReceiptsRepository,
  ) {}

  /**
   * Persists a message, optionally as a reply to `parentId`.
   *
   * The reply target is checked here rather than at the entry point: unlike
   * channel membership (which the HTTP and socket surfaces report differently),
   * "you can only quote a message from this same channel" is a domain invariant
   * that holds for every caller — and it is what stops a crafted `parentId` from
   * leaking one channel's content into another as a quote.
   */
  public async saveMessage(data: {
    content: string;
    channelId: string;
    authorId: string;
    parentId?: string | null;
    imageUrl?: string | null;
    imageWidth?: number | null;
    imageHeight?: number | null;
  }): Promise<MessageWithAuthor> {
    // A message has to say something: text, a photo, or a photo with a caption.
    // `content` is empty on an uncaptioned photo, which is why emptiness alone
    // is not the test.
    if (!data.content.trim() && !data.imageUrl) {
      throw new ValidationError("A message needs text or an image.");
    }

    if (data.parentId) {
      const parentChannelId = await this.messagesQuery.getChannelIdOf(data.parentId);

      if (parentChannelId === null) {
        throw new NotFoundError("The message you replied to no longer exists.");
      }

      if (parentChannelId !== data.channelId) {
        throw new ValidationError("You can only reply to a message in the same channel.");
      }
    }

    return this.messagesRepository.create(data);
  }

  public async getMessages(params: { channelId: string; limit?: number; cursor?: string }): Promise<PaginatedMessages> {
    return this.messagesQuery.getMessages(params);
  }

  public async getUnreadMessages(channelId: string, userId: string): Promise<UnreadMessage[]> {
    return this.messagesQuery.getUnreadMessages(channelId, userId);
  }

  /** Records that `userId` has read `messageIds`; returns how many receipts were newly created. */
  public async recordReads(userId: string, messageIds: string[]): Promise<{ count: number }> {
    return this.messageReceiptsRepository.createMessageReceipts(userId, messageIds);
  }
}
