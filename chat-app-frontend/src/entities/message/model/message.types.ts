export interface Message {
  id: string;
  content: string;
  roomId: string;
  authorId: string;
  createdAt: string;
}

export interface InboxItem {
  roomId: string;
  lastMessage: string;
  updatedAt: string;
  otherUser: {
    name: string;
    image: string;
    id: string;
    username: string;
  };
}
