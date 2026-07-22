import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { MessageWithAuthor } from "../messages.types";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { MESSAGE_AUTHOR_SELECT } from "@/shared/persistence/selectors";
import type { Executor } from "@/shared/persistence/transaction";

/** Write side of the message module: persisting a new message. */
@injectable()
export class MessagesRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  public async create(
    data: { content: string; channelId: string; authorId: string },
    executor?: Executor,
  ): Promise<MessageWithAuthor> {
    return withPersistence("Failed to create message.", async () => {
      const message = await this.client(executor).message.create({
        data,
        include: { author: { select: MESSAGE_AUTHOR_SELECT } },
      });

      // A message this new cannot have been read, so the count is known without
      // asking the database for it.
      return { ...message, readCount: 0 };
    });
  }
}
