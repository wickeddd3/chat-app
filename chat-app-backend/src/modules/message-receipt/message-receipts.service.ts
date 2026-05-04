import { MessageReceiptsRepository } from "./message-receipts.repository";

export class MessageReceiptsService {
  private messageReceiptsRepository = new MessageReceiptsRepository();

  public async createMessageReceipts(userId: string, ids: number[]) {
    try {
      return await this.messageReceiptsRepository.createMessageReceipts(userId, ids);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create batch message receipts");
    }
  }
}
