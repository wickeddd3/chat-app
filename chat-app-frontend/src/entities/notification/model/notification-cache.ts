import type { QueryClient } from "@tanstack/react-query";
import type { NotificationFilter } from "@/shared/config/react-query-keys";

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
