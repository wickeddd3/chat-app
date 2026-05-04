import type { Channel, ChannelMember, User } from "@/prisma/client";

export interface InboxChannelMember extends ChannelMember {
  user: Partial<User>;
}

export interface InboxChannel extends Channel {
  channelMembers: InboxChannelMember[];
}
