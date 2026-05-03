import type { Message } from "@/prisma/client";
import { MessagesRepository } from "./messages.repository";

export class MessagesService {
  private messagesRepository = new MessagesRepository();

  public async saveMessage(data: {
    content: string;
    channelId: number;
    authorId: string;
  }): Promise<Message & { author: { id: string; name: string; image: string | null } }> {
    try {
      return await this.messagesRepository.create(data);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to save message");
    }
  }

  public async getMessages(channelId: number): Promise<Partial<Message[]>> {
    try {
      return await this.messagesRepository.getMessages(channelId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve messages");
    }
  }
}
