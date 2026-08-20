export interface MessageAuthor {
  id?: string;
  name?: string;
  image?: string | null;
}
/**
 * `SYSTEM` is a line the app wrote about a membership event ("Ada left the
 * group"). It still carries the member it is about as its author, so the name
 * and avatar resolve; the type is what changes how it renders and keeps it out
 * of unread counts. Absent on messages that predate the column — read as USER.
 */
export type MessageKind = "USER" | "SYSTEM";

/**
 * The message a reply quotes. The server snapshots it onto the reply, so the
 * quote renders even when the original sits outside the loaded page — and it is
 * shallow, so a reply to a reply quotes only its own parent, never the chain.
 */
export interface MessageParent {
  id: string;
  content: string;
  type?: MessageKind;
  author: MessageAuthor;
}

export interface Message {
  id: string;
  author: MessageAuthor;
  content: string;
  type?: MessageKind;
  createdAt: string;
  authorId: string;
  channelId: string;
  /** The quoted message's id — what "jump to original" scrolls to. */
  parentId?: string | null;
  /** The quote itself. Absent/null on a message that is not a reply. */
  parent?: MessageParent | null;
  clientId?: string;
  isSending?: boolean;
  /**
   * Recipients who have read this message. Authors never receive a receipt for
   * their own message, so anything above zero means it has been read. Absent on
   * a message that predates the read receipt, which reads as unread.
   */
  readCount?: number;
}

export interface NewMessage {
  id?: string;
  author: MessageAuthor;
  content: string;
  createdAt: string;
  channelId: string;
  clientId: string;
  isSending: boolean;
  /** Set optimistically so the quote is drawn before the server echoes back. */
  parentId?: string | null;
  parent?: MessageParent | null;
}

export interface PaginatedMessage {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}
