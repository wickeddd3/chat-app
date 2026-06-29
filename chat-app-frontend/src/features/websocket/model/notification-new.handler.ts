import type { QueryClient } from "@tanstack/react-query";
import type { Notification } from "@/entities/notification";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import { toast } from "sonner";

export type IncomingNotificationPayload = Notification;

export const handleIncomingNotification = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: IncomingNotificationPayload,
) => {
  const notification = payload;

  // Append new notification to exisitng notification cache
  queryClient.setQueryData(
    queryKeys.notifications.list(),
    (oldData: { pages: { notifications: Notification[] }[] }) => {
      if (!oldData) return oldData;

      const updatedPages = [...oldData.pages];

      if (updatedPages[0]) {
        updatedPages[0] = {
          ...updatedPages[0],
          notifications: [notification, ...updatedPages[0].notifications],
        };
      }

      return { ...oldData, pages: updatedPages };
    },
  );

  // Increment unread notification count
  queryClient.setQueryData(
    queryKeys.dashboard.badges(),
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["unreadNotificationsCount"] =
        currentUnreadCountStats["unreadNotificationsCount"] + 1;

      return currentUnreadCountStats;
    },
  );

  // Show notification toast
  toast.info(notification.title, { description: notification.content });
};
