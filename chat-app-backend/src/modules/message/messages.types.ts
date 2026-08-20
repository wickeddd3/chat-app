import { Message } from "@/prisma/client";
import type { MessageType } from "@/prisma/enums";

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

/**
 * The message a reply quotes, snapshotted onto the reply itself so the quote
 * renders without a second fetch (the parent is often outside the loaded page).
 * Shallow by design: a reply to a reply carries its own parent only.
 */
export interface MessageParent {
  id: string;
  content: string;
  type: MessageType;
  author: MessageAuthor;
}

export interface MessageWithAuthor extends Message {
  author: MessageAuthor;
  /** The quoted message, or `null` when this message is not a reply. */
  parent: MessageParent | null;
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
