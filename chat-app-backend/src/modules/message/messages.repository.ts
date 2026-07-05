import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { MessageWithAuthor, PaginatedMessages, UnreadMessage } from "./messages.types";
import { HttpException } from "@/utils/http.exception";
import { decodeCursor, encodeCursor } from "@/utils/cursor";

@injectable()
export class MessagesRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async create(data: { content: string; channelId: string; authorId: string }): Promise<MessageWithAuthor> {
    try {
      return await this.db.message.create({
        data,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    } catch (error) {
      throw new HttpException(500, "Failed to create message.", null, { cause: error });
    }
  }

  public async getMessages({
    channelId,
    limit = 20,
    cursor,
  }: {
    channelId: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedMessages> {
    try {
      // Chat history loads newest-first (scroll up for older). Fetch descending
      // via a (createdAt, id) keyset, then reverse the page to ascending order.
      const decoded = decodeCursor(cursor);
      const messages = await this.db.message.findMany({
        where: {
          channelId,
          // Keyset cursor: (createdAt, id) strictly before (older than) the boundary.
          ...(decoded && {
            OR: [{ createdAt: { lt: decoded.timestamp } }, { createdAt: decoded.timestamp, id: { lt: decoded.id } }],
          }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        // Fetch one extra to reliably determine hasMore.
        take: limit + 1,
      });

      const hasMore = messages.length > limit;
      const pageItems = hasMore ? messages.slice(0, limit) : messages;

      // The oldest item in this (descending) page is the boundary for the next
      // (older) page.
      const oldest = pageItems.at(-1);
      const nextCursor = hasMore && oldest ? encodeCursor(oldest.createdAt, oldest.id) : null;

      return {
        // Reverse to ascending (oldest first) for display.
        messages: [...pageItems].reverse(),
        hasMore,
        nextCursor,
      };
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve messages.", null, { cause: error });
    }
  }

  public async getUnreadMessages(channelId: string, userId: string): Promise<UnreadMessage[]> {
    try {
      const messages = await this.db.message.findMany({
        where: {
          channelId: channelId,
          authorId: { not: userId },
          readBy: { none: { userId } },
        },
        select: { id: true },
      });

      return messages;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve unread messages.", null, { cause: error });
    }
  }
}
