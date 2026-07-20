import type { QueryClient } from "@tanstack/react-query";
import {
  invalidateNotificationFilters,
  prependNotification,
  type Notification,
} from "@/entities/notification";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import { toast } from "sonner";

export type IncomingNotificationPayload = Notification;

export const handleIncomingNotification = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: IncomingNotificationPayload,
) => {
  const notification = payload;

  // Append new notification to exisitng notification cache (and its tab total)
  prependNotification(
    queryClient,
    queryKeys.notifications.list(),
    notification,
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

  // A new notification arrives unread, so it just entered the Unread tab's set —
  // refetch that server-filtered list and its badge total.
  invalidateNotificationFilters(queryClient, ["unread"]);

  // Show notification toast
  toast.info(notification.title, { description: notification.content });
};
