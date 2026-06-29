import type { QueryClient } from "@tanstack/react-query";
import type { Notification } from "@/entities/notification";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import { toast } from "sonner";

// Real-time notifications interceptor
export const handleIncomingNotification = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  notification: Notification,
) => {
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

  toast.info(notification.title, { description: notification.content });
};
