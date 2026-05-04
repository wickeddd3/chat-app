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
  id: number;
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
  };
  messages: {
    id: number;
    content: string;
    createdAt: string;
  }[];
  recipient: ChannelRecipient | null;
  online?: () => boolean;
}
