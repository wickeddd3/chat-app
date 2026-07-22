import { Notification } from "@/prisma/client";
import type { NotificationType } from "@/prisma/enums";

export type NotificationFilter = "all" | "unread";

/**
 * A notification to be persisted. Other modules compose this (the copy is their
 * domain knowledge) and hand it to `NotificationsRepository.create` — they never
 * write the table themselves.
 */
export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  /** Links the alert back to its subject (a connection or channel id). */
  referenceId?: string | null;
}

export interface PaginatedNotifications {
  notifications: Partial<Notification>[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total notifications matching the filter (across all pages), for tab badges. */
  total: number;
}
