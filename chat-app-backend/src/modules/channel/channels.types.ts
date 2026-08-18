import type { Channel, ChannelMember, Message, User } from "@/prisma/client";
import type { MessageWithAuthor } from "@/modules/message/messages.types";

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

/** What a departure changed, so the caller can broadcast it accurately. */
export interface LeaveChannelResult {
  channelId: string;
  /** Who is still in the group — the fan-out set for the departure event. */
  remainingMemberIds: string[];
  /** Set when the last admin left and someone inherited the role. */
  promotedAdminId: string | null;
  /** True when the last member left and the channel was deleted outright. */
  channelDeleted: boolean;
  /** The "X left the group" line, absent when the channel was deleted. */
  systemMessage: MessageWithAuthor | null;
}

export interface PaginatedChannels {
  channels: InboxChannel[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total channels matching the filter (across all pages), for tab badges. */
  total: number;
}
