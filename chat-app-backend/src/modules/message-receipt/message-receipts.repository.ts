import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import { HttpException } from "@/utils/http.exception";

@injectable()
export class MessageReceiptsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async createMessageReceipts(userId: string, ids: string[]) {
    try {
      return await this.db.messageReceipt.createMany({
        data: ids.map((id) => ({
          messageId: id,
          userId: userId,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      throw new HttpException(500, "Failed to create batch message receipts.", null, { cause: error });
    }
  }
}
