import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { MessageReceiptsRepository } from "./message-receipts.repository";

@injectable()
export class MessageReceiptsService {
  constructor(@inject(TYPES.MessageReceiptsRepository) private messageReceiptsRepository: MessageReceiptsRepository) {}

  public async createMessageReceipts(userId: string, ids: number[]) {
    try {
      return await this.messageReceiptsRepository.createMessageReceipts(userId, ids);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create batch message receipts");
    }
  }
}
