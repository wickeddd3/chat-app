import { randomUUID } from "crypto";
import type { Notification } from "@/prisma/client";
import type { NotificationType } from "@/prisma/enums";
import { prisma } from "@/test/helpers/db.helper";

export interface NotificationOverrides {
  userId: string;
  type?: NotificationType;
  title?: string;
  content?: string;
  isRead?: boolean;
  referenceId?: string;
  createdAt?: Date;
}

/** Inserts a Notification row (defaults to an unread CONNECTION_REQUEST). */
export async function createNotification(overrides: NotificationOverrides): Promise<Notification> {
  return prisma.notification.create({
    data: {
      userId: overrides.userId,
      type: overrides.type ?? "CONNECTION_REQUEST",
      title: overrides.title ?? "New Connection Request",
      content: overrides.content ?? `notification-${randomUUID().slice(0, 8)}`,
      isRead: overrides.isRead ?? false,
      ...(overrides.referenceId && { referenceId: overrides.referenceId }),
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
    },
  });
}
