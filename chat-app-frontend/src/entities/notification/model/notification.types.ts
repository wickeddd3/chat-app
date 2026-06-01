export type NotificationType =
  | "CONNECTION_REQUEST"
  | "CONNECTION_ACCEPTED"
  | "CHANNEL_INVITE";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  hasMore: boolean;
  nextCursor: string | null;
}
