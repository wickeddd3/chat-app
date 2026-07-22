import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { MessagesRepository } from "./persistence/messages.repository";
import { MessagesQuery } from "./persistence/messages.query";
import { MessageReceiptsRepository } from "./persistence/message-receipts.repository";
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

  public async saveMessage(data: { content: string; channelId: string; authorId: string }): Promise<MessageWithAuthor> {
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
