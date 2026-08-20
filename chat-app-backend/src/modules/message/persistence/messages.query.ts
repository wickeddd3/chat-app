import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient, Prisma } from "@/prisma/client";
import type { PaginatedMessages, UnreadMessage } from "../messages.types";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { buildKeysetPage, keysetFilter, keysetTake } from "@/shared/persistence/keyset-pagination";
import { MESSAGE_AUTHOR_SELECT, MESSAGE_PARENT_SELECT } from "@/shared/persistence/selectors";

/**
 * Read side of the message module: chat history and the unread lookup. No
 * mutations, no authorization (channel membership is checked at the entry point).
 */
@injectable()
export class MessagesQuery {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  /**
   * A page of a channel's history, oldest-first for display.
   *
   * History loads newest-first (scroll up for older), so the keyset seeks
   * descending on `(createdAt, id)` and the page is reversed to ascending before
   * returning — the oldest row of the descending page is the boundary for the
   * next (older) page.
   */
  public async getMessages({
    channelId,
    limit = 20,
    cursor,
  }: {
    channelId: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedMessages> {
    return withPersistence("Failed to retrieve messages.", async () => {
      const rows = await this.db.message.findMany({
        where: {
          channelId,
          AND: keysetFilter<Prisma.MessageWhereInput>("createdAt", cursor),
        },
        include: {
          author: { select: MESSAGE_AUTHOR_SELECT },
          // Snapshot of the quoted message, so a reply renders its quote even
          // when the parent sits outside the loaded page.
          parent: { select: MESSAGE_PARENT_SELECT },
          // The individual readers are never rendered, so send the total rather
          // than rows the client would only count.
          _count: { select: { readBy: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: keysetTake(limit),
      });

      const page = buildKeysetPage({
        rows,
        limit,
        timestampOf: (row) => row.createdAt,
        idOf: (row) => row.id,
        map: ({ _count, ...message }) => ({ ...message, readCount: _count.readBy }),
      });

      return {
        // Reverse to ascending (oldest first) for display; the cursor was already
        // taken from the oldest row of the descending page.
        messages: page.items.reverse(),
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
      };
    });
  }

  /**
   * Which channel a message belongs to, or `null` when there is no such message.
   * Used to check a reply target before persisting the reply — the row itself is
   * never needed, only where it lives.
   */
  public async getChannelIdOf(messageId: string): Promise<string | null> {
    return withPersistence("Failed to retrieve message.", async () => {
      const message = await this.db.message.findUnique({
        where: { id: messageId },
        select: { channelId: true },
      });

      return message?.channelId ?? null;
    });
  }

  /**
   * Messages in a channel authored by someone else that this user has not yet
   * read. System lines are excluded: nobody sent them, so there is no one to
   * report a receipt back to.
   */
  public async getUnreadMessages(channelId: string, userId: string): Promise<UnreadMessage[]> {
    return withPersistence("Failed to retrieve unread messages.", () =>
      this.db.message.findMany({
        where: { channelId, type: "USER", authorId: { not: userId }, readBy: { none: { userId } } },
        select: { id: true, authorId: true },
      }),
    );
  }
}
