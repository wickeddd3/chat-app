import { Message } from "@/prisma/client";

export interface PaginatedMessages {
  messages: Partial<Message>[];
  hasMore: boolean;
  nextCursor: number | null | undefined;
}
