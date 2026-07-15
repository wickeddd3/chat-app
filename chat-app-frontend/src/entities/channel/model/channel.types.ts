export interface Channel {
  id: string;
  name: string;
  type: string;
}

export interface ChannelRecipient {
  id: string;
  name: string;
  image: string | null;
  username: string;
}

export interface ChannelMember {
  id: string;
  role: string;
  user: ChannelRecipient;
}

export interface InboxChannel extends Channel {
  displayName: string;
  displayImage: string;
  channelMembers: ChannelMember[];
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  messages: {
    id: string;
    content: string;
    createdAt: string;
  }[];
  recipient: ChannelRecipient | null;
  unreadCount?: number;
  online?: boolean;
}

export interface PaginatedInboxChannel {
  channels: InboxChannel[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total channels matching the filter, across all pages (for tab badges). */
  total: number;
}
