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
  /** Set when the quoted message is a photo — the quote shows a thumbnail. */
  imageUrl?: string | null;
  author: MessageAuthor;
}

/**
 * A photo attached to a message. The bytes go straight from the browser to
 * Supabase Storage, so only the resulting public URL is ever sent to our API.
 * `content` doubles as the caption and is empty when there wasn't one.
 */
export interface MessageAttachment {
  imageUrl?: string | null;
  /** Natural size, used to reserve the bubble's box before the image loads. */
  imageWidth?: number | null;
  imageHeight?: number | null;
}

export interface Message extends MessageAttachment {
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

export interface NewMessage extends MessageAttachment {
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
  /**
   * Local object URL for a photo still uploading, so the sender sees their own
   * image immediately instead of a placeholder. Replaced by `imageUrl` once the
   * server echoes the stored message back.
   */
  previewUrl?: string;
  /** 0–100 while the bytes go out; absent once the upload has finished. */
  uploadProgress?: number;
  /** The upload failed — the bubble offers a retry instead of a progress ring. */
  uploadFailed?: boolean;
}

export interface PaginatedMessage {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}
