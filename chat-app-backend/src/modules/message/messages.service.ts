import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { MessagesRepository } from "./messages.repository";
import type { MessageWithAuthor, PaginatedMessages, UnreadMessage } from "./messages.types";

@injectable()
export class MessagesService {
  constructor(@inject(TYPES.MessagesRepository) private messagesRepository: MessagesRepository) {}

  public async saveMessage(data: { content: string; channelId: number; authorId: string }): Promise<MessageWithAuthor> {
    try {
      return await this.messagesRepository.create(data);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to save message");
    }
  }

  public async getMessages({
    channelId,
    limit = 20,
    cursor,
  }: {
    channelId: number;
    limit?: number;
    cursor?: number;
  }): Promise<PaginatedMessages> {
    try {
      return await this.messagesRepository.getMessages({
        channelId,
        limit,
        ...(cursor !== undefined ? { cursor } : {}),
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve messages");
    }
  }

  public async getUnreadMessages(channelId: number, userId: string): Promise<UnreadMessage[]> {
    try {
      return await this.messagesRepository.getUnreadMessages(channelId, userId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve unread messages");
    }
  }
}
