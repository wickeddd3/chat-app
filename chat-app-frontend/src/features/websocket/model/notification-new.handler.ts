import type { QueryClient } from "@tanstack/react-query";
import type { Notification } from "@/entities/notification";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";
import { toast } from "sonner";

// Real-time notifications interceptor
export const handleIncomingNotification = (
  queryClient: QueryClient,
  notification: Notification,
) => {
  // Append new notification to exisitng notification cache
  queryClient.setQueryData(
    REACT_QUERY_KEYS["NOTIFICATIONS"],
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
    REACT_QUERY_KEYS["UNREAD_COUNT_STATS"],
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
