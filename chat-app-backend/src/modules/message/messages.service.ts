import type { Message } from "@/prisma/client";
import { MessagesRepository } from "./messages.repository";

export class MessagesService {
  private messagesRepository = new MessagesRepository();

  public async getMessagesByRoomId(roomId: string): Promise<Partial<Message[]>> {
    try {
      return await this.messagesRepository.getMessagesByRoomId(roomId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve messages");
    }
  }

  public async getInbox(userId: string) {
    try {
      return await this.messagesRepository.getInbox(userId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve inbox");
    }
  }

  public async saveMessage(data: {
    content: string;
    roomId: string;
    authorId: string;
  }): Promise<Message & { author: { id: string; name: string; image: string | null } }> {
    try {
      return await this.messagesRepository.create(data);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to save message");
    }
  }
}
