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
  /**
   * Whether the viewer may still post here. Always true for groups; false for a
   * direct channel whose members are no longer connected — the history stays
   * readable, but the composer is replaced by a notice. Only the channel-details
   * endpoint sends it, so inbox rows leave it undefined (treated as allowed).
   */
  canMessage?: boolean;
}

export interface PaginatedInboxChannel {
  channels: InboxChannel[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total channels matching the filter, across all pages (for tab badges). */
  total: number;
}
