import { Message } from "@/prisma/client";

export interface MessageAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface MessageWithAuthor extends Message {
  author: MessageAuthor;
}

export interface PaginatedMessages {
  messages: Partial<MessageWithAuthor>[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface UnreadMessage {
  id: string;
}
