import type { Channel, ChannelMember, Message, User } from "@/prisma/client";

export interface InboxChannelMember extends ChannelMember {
  user: Partial<User>;
}

export interface InboxChannel extends Channel {
  channelMembers: InboxChannelMember[];
  messages: Message[];
}
