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

export interface InboxChannel extends Channel {
  displayName: string;
  displayImage: string;
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
}
