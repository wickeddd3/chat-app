import { Notification } from "@/prisma/client";

export interface PaginatedNotifications {
  notifications: Partial<Notification>[];
  hasMore: boolean;
  nextCursor: string | null;
}
