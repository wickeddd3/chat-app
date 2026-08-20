import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { MessageType } from "@/prisma/enums";
import type { MessageWithAuthor } from "../messages.types";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { MESSAGE_AUTHOR_SELECT, MESSAGE_PARENT_SELECT } from "@/shared/persistence/selectors";
import type { Executor } from "@/shared/persistence/transaction";

/** Write side of the message module: persisting a new message. */
@injectable()
export class MessagesRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  /**
   * Persists a message. `type` defaults to `USER`; another module's service
   * passes `SYSTEM` (inside its own transaction) for a membership event it
   * narrates — see `channels.messages.ts`. `parentId` marks the message as a
   * reply; the service has already checked the target is in the same channel.
   */
  public async create(
    data: {
      content: string;
      channelId: string;
      authorId: string;
      type?: MessageType;
      parentId?: string | null;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
    executor?: Executor,
  ): Promise<MessageWithAuthor> {
    return withPersistence("Failed to create message.", async () => {
      const message = await this.client(executor).message.create({
        data,
        include: {
          author: { select: MESSAGE_AUTHOR_SELECT },
          // Returned on the write so the broadcast payload carries the quote —
          // recipients render the reply without going back for its parent.
          parent: { select: MESSAGE_PARENT_SELECT },
        },
      });

      // A message this new cannot have been read, so the count is known without
      // asking the database for it.
      return { ...message, readCount: 0 };
    });
  }
}
