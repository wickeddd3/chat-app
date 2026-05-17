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
  channelId: number;
  parentId: string;
  clientId?: string;
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
  nextCursor: string;
}
