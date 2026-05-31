import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { Message } from "@/prisma/client";
import type { PaginatedMessages } from "./messages.types";

@injectable()
export class MessagesRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async create(data: {
    content: string;
    channelId: number;
    authorId: string;
  }): Promise<Message & { author: { id: string; name: string; image: string | null } }> {
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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create message");
    }
  }

  public async getMessages({
    channelId,
    limit = 20,
    cursor,
  }: {
    channelId: number;
    limit?: number;
    cursor?: number;
  }): Promise<PaginatedMessages> {
    try {
      const messages = await this.db.message.findMany({
        where: { channelId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        // Fetch one extra item if a cursor is present to act as our boundary check
        take: cursor ? -(limit + 1) : -limit,
        // Inclue cursor to query only if exist
        ...(cursor && { cursor: { id: cursor } }),
      });

      let nextCursor: number | null = null;
      let finalMessages = messages;

      if (cursor) {
        // If a cursor was passed, the last item in the returned array is
        // actually the cursor item itself (the duplicate).
        if (messages.length > limit) {
          // Remove the duplicate boundary item from the end of the array
          finalMessages = messages.slice(1);
          // The very first item in the array is now our next oldest cursor
          nextCursor = messages[0]?.id ?? null;
        } else {
          nextCursor = null;
        }
      } else {
        // Initial load (no cursor)
        nextCursor = (messages.length === limit ? messages[0]?.id : null) || null;
      }

      return {
        messages: finalMessages,
        hasMore: nextCursor !== null,
        nextCursor,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve messages");
    }
  }

  public async getUnreadMessages(channelId: number, userId: string): Promise<{ id: number }[]> {
    try {
      const messages = await this.db.message.findMany({
        where: {
          channelId: Number(channelId),
          authorId: { not: userId },
          readBy: { none: { userId } },
        },
        select: { id: true },
      });

      return messages;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve unread messages");
    }
  }
}
