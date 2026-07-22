import { Message } from "@/prisma/client";

export interface MessageAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface MessageWithAuthor extends Message {
  author: MessageAuthor;
  /**
   * How many other members have read this message. An author never receives a
   * receipt for their own message, so this counts recipients only — any value
   * above zero means the message has been read.
   */
  readCount: number;
}

export interface PaginatedMessages {
  messages: MessageWithAuthor[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface UnreadMessage {
  id: string;
  /** Carried so a read can be reported back to the person who sent it. */
  authorId: string;
}
