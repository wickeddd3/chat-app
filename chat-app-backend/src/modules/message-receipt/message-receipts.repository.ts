import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";

@injectable()
export class MessageReceiptsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async createMessageReceipts(userId: string, ids: number[]) {
    try {
      return await this.db.messageReceipt.createMany({
        data: ids.map((id) => ({
          messageId: id,
          userId: userId,
        })),
        skipDuplicates: true,
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create batch message receipts");
    }
  }
}
