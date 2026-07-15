import { Notification } from "@/prisma/client";

export type NotificationFilter = "all" | "unread";

export interface PaginatedNotifications {
  notifications: Partial<Notification>[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total notifications matching the filter (across all pages), for tab badges. */
  total: number;
}
