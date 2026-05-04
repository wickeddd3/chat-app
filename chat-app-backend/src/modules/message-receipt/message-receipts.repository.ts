import { prisma } from "@/lib/prisma";

export class MessageReceiptsRepository {
  private db = prisma;

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
