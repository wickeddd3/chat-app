import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import type { NotificationFilter } from "@/shared/config/react-query-keys";
import type {
  Notification,
  PaginatedNotifications,
} from "./notification.types";

type NotificationsInfiniteData = InfiniteData<PaginatedNotifications>;

/**
 * `total` is the filter-wide count backing a tab badge and every page carries a
 * copy of it, so an optimistic list patch has to move it too or the badge drifts
 * from the list until the next refetch. Readers take it off page 0.
 */
function withTotalDelta(
  pages: PaginatedNotifications[],
  delta: number,
): PaginatedNotifications[] {
  return pages.map((page) => ({
    ...page,
    total: Math.max(0, page.total + delta),
  }));
}

/**
 * Prepends a notification to the first page of a cached list and increments its
 * badge total. Idempotent on the notification id, so a duplicate socket event
 * can't double-count it.
 */
export function prependNotification(
  queryClient: QueryClient,
  queryKey: QueryKey,
  notification: Notification,
): void {
  queryClient.setQueryData<NotificationsInfiniteData>(queryKey, (data) => {
    if (!data) return data;

    const alreadyPresent = data.pages.some((page) =>
      page.notifications.some((n) => n.id === notification.id),
    );
    if (alreadyPresent) return data;

    const [firstPage, ...restPages] = data.pages;
    if (!firstPage) return data;

    const pages = [
      {
        ...firstPage,
        notifications: [notification, ...firstPage.notifications],
      },
      ...restPages,
    ];

    return { ...data, pages: withTotalDelta(pages, 1) };
  });
}

/**
 * Removes every notification pointing at `referenceId` (e.g. the notification
 * for a connection request that was just declined or canceled) and decrements
 * the badge total by however many were actually dropped. No-op when none are
 * cached, so a repeated event can't decrement twice.
 */
export function removeNotificationsByReference(
  queryClient: QueryClient,
  queryKey: QueryKey,
  referenceId: string,
): void {
  queryClient.setQueryData<NotificationsInfiniteData>(queryKey, (data) => {
    if (!data) return data;

    let removed = 0;
    const pages = data.pages.map((page) => {
      const notifications = page.notifications.filter(
        (n) => n.referenceId !== referenceId,
      );
      removed += page.notifications.length - notifications.length;
      return { ...page, notifications };
    });

    if (removed === 0) return data;

    return { ...data, pages: withTotalDelta(pages, -removed) };
  });
}

/**
 * Invalidates only the given tab-filter notification lists, leaving the others —
 * notably the optimistically-patched "all" list — untouched. Used when a change
 * moves a notification in or out of a filtered set (a new notification arrives
 * unread, one is marked read, or one is removed), so both the list content and
 * the server-driven badge total reconcile.
 */
export function invalidateNotificationFilters(
  queryClient: QueryClient,
  filters: NotificationFilter[],
): void {
  const wanted = new Set<NotificationFilter>(filters);
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) &&
        key[1] === "notifications" &&
        key[2] === "list" &&
        typeof key[3] === "string" &&
        wanted.has(key[3] as NotificationFilter)
      );
    },
  });
}
