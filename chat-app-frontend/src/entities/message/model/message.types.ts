export interface MessageAuthor {
  id?: string;
  name?: string;
  image?: string | null;
}
export interface Message {
  id: string;
  author: MessageAuthor;
  content: string;
  createdAt: string;
  authorId: string;
  channelId: string;
  parentId: string;
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
}

export interface PaginatedMessage {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}
