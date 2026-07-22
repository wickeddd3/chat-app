import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import type { Executor } from "@/shared/persistence/transaction";

@injectable()
export class MessageReceiptsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  /**
   * Records that `userId` has read the given messages. `skipDuplicates` makes it
   * idempotent — re-reading already-read messages is a no-op, and `count`
   * reflects only the receipts actually created.
   */
  public async createMessageReceipts(userId: string, ids: string[], executor?: Executor): Promise<{ count: number }> {
    return withPersistence("Failed to create batch message receipts.", () =>
      this.client(executor).messageReceipt.createMany({
        data: ids.map((id) => ({ messageId: id, userId })),
        skipDuplicates: true,
      }),
    );
  }
}
