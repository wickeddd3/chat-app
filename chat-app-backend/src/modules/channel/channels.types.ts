import type { Channel, ChannelMember, Message, User } from "@/prisma/client";

export interface InboxChannelMember extends ChannelMember {
  user: Partial<User>;
}

export interface InboxChannel extends Channel {
  channelMembers: InboxChannelMember[];
  messages: Message[];
  _count: {
    messages: number;
  };
}

export type ChannelFilter = "all" | "unread" | "groups";

export interface PaginatedChannels {
  channels: InboxChannel[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total channels matching the filter (across all pages), for tab badges. */
  total: number;
}
