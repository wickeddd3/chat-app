import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { MessageReceiptsRepository } from "./message-receipts.repository";
import { HttpException } from "@/utils/http.exception";

@injectable()
export class MessageReceiptsService {
  constructor(@inject(TYPES.MessageReceiptsRepository) private messageReceiptsRepository: MessageReceiptsRepository) {}

  public async createMessageReceipts(userId: string, ids: number[]) {
    try {
      return await this.messageReceiptsRepository.createMessageReceipts(userId, ids);
    } catch (error) {
      throw new HttpException(500, "Failed to create batch message receipts.");
    }
  }
}
