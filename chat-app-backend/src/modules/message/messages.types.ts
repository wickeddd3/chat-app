import { Message } from "@/prisma/client";

/**
 * A system line another module composed about one of its events (e.g. "X left
 * the group"). Carries the member it concerns as its author, so the row keeps a
 * required author; `type` is what excludes it from unread counts and receipts.
 */
export interface NewSystemMessage {
  channelId: string;
  authorId: string;
  content: string;
  type: "SYSTEM";
}

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
