import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { MessagesRepository } from "./persistence/messages.repository";
import { MessagesQuery } from "./persistence/messages.query";
import type { MessageWithAuthor, PaginatedMessages, UnreadMessage } from "./messages.types";

/**
 * Message orchestration. Thin by nature — there are no cross-module writes or
 * state-transition rules here — so it delegates and lets domain errors propagate
 * rather than re-wrapping them as opaque 500s.
 */
@injectable()
export class MessagesService {
  constructor(
    @inject(TYPES.MessagesRepository) private messagesRepository: MessagesRepository,
    @inject(TYPES.MessagesQuery) private messagesQuery: MessagesQuery,
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
}
