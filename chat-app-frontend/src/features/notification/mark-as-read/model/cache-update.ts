import type { Notification } from "@/entities/notification";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type TData = { count: number };
export type TError = Error;
export type TVariables = string[];
export type TContext = {
  previousRequests: unknown; // Specific shape of cached query data
  client: QueryClient; // Passing the client via custom context
  keys: ScopedQueryKeys;
};

export async function onMutate(
  _variables: TVariables,
  context: { client: QueryClient; keys: ScopedQueryKeys },
): Promise<TContext> {
  // Snapshot the previous value to restore if things break
  const previousRequests = context.client.getQueryData(
    context.keys.notifications.list(),
  );

  // Return the context object containing the rollback snapshot data
  return { previousRequests, client: context.client, keys: context.keys };
}

export function onError(
  _err: TError,
  _variables: TVariables,
  _context: TContext | undefined,
) {
  toast.error("Marking notification as read failed", {
    description: "Error occurred while marking notification as read",
    position: "bottom-right",
  });
}

export function onSuccess(
  _data: TData,
  variables: TVariables,
  context: TContext | undefined,
) {
  const notificationIds = variables;

  // Update notifications cache data to mark notification as read
  context?.client.setQueryData(
    context.keys.notifications.list(),
    (old: { pages: { notifications: Notification[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page: { notifications: Notification[] }) => {
          return {
            ...page,
            notifications: page.notifications.map((notif: Notification) => {
              if (notificationIds.includes(notif.id)) {
                return {
                  ...notif,
                  isRead: true,
                };
              }

              return notif;
            }),
          };
        }),
      };
    },
  );

  // Decrement unread notification count
  context?.client.setQueryData(
    context.keys.dashboard.badges(),
    (old: Record<string, number>) => {
      if (!old) return old;

      const currentUnreadCountStats = { ...old };
      currentUnreadCountStats["unreadNotificationsCount"] =
        currentUnreadCountStats["unreadNotificationsCount"] - 1;

      return currentUnreadCountStats;
    },
  );
}
