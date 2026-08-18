import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type {
  InboxFilter,
  ScopedQueryKeys,
} from "@/shared/config/react-query-keys";
import type { InboxChannel, PaginatedInboxChannel } from "./channel.types";

type InboxInfiniteData = InfiniteData<PaginatedInboxChannel>;

/**
 * Partial query key matching every cached inbox list for the scope — i.e. all
 * search-query and filter variants (`[scope, "inbox", "list", …]`). Dropping the
 * trailing segments turns the exact key into a prefix filter that
 * `setQueriesData` / `invalidateQueries` match against.
 */
export function inboxListPrefix(keys: ScopedQueryKeys): unknown[] {
  return keys.inbox.list("").slice(0, 3);
}

/**
 * Invalidates only the given tab-filter inbox lists (across every search-query
 * variant), leaving the others — notably the optimistically-patched "all" list —
 * untouched. Used when a realtime event changes a channel's membership in a
 * filtered set (e.g. a new message makes a channel unread, or a read clears it),
 * so both the list content and the server-driven badge total reconcile.
 */
export function invalidateInboxFilters(
  queryClient: QueryClient,
  filters: InboxFilter[],
): void {
  const wanted = new Set<InboxFilter>(filters);
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) &&
        key[1] === "inbox" &&
        key[2] === "list" &&
        typeof key[4] === "string" &&
        wanted.has(key[4] as InboxFilter)
      );
    },
  });
}

/**
 * Builds a display-complete `InboxChannel` for a freshly created GROUP from the
 * form input + the server-assigned id.
 *
 * Mirrors the backend `channelToInboxChannel` transform for the group case:
 * `displayName` is the group name, there's no image or messages yet, and the
 * unread count is zero. `channelMembers` is intentionally left empty — the inbox
 * row never renders it (only used to derive the online dot, where `[]` reads as
 * offline), and it's reconciled by the follow-up invalidation.
 */
export function buildOptimisticGroupChannel(
  id: string,
  name: string,
): InboxChannel {
  return {
    id,
    type: "GROUP",
    name,
    displayName: name,
    displayImage: "",
    channelMembers: [],
    messages: [],
    lastMessage: null,
    recipient: null,
    unreadCount: 0,
    online: false,
  };
}

/**
 * Prepends a channel to the first page of every cached inbox list. Idempotent:
 * lists that already contain the id are left untouched, so it's safe against a
 * racing background refetch.
 */
export function prependInboxChannel(
  queryClient: QueryClient,
  keys: ScopedQueryKeys,
  channel: InboxChannel,
): void {
  queryClient.setQueriesData<InboxInfiniteData>(
    { queryKey: inboxListPrefix(keys) },
    (data) => {
      if (!data) return data;

      const alreadyPresent = data.pages.some((page) =>
        page.channels.some((c) => c.id === channel.id),
      );
      if (alreadyPresent) return data;

      const [firstPage, ...restPages] = data.pages;
      if (!firstPage) return data;

      return {
        ...data,
        pages: [
          { ...firstPage, channels: [channel, ...firstPage.channels] },
          ...restPages,
        ],
      };
    },
  );
}

/**
 * Applies a partial patch to a channel wherever it appears across all cached
 * inbox lists. No-op for lists that don't contain the id.
 */
export function patchInboxChannel(
  queryClient: QueryClient,
  keys: ScopedQueryKeys,
  channelId: string,
  patch: Partial<InboxChannel>,
): void {
  queryClient.setQueriesData<InboxInfiniteData>(
    { queryKey: inboxListPrefix(keys) },
    (data) => {
      if (!data) return data;

      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          channels: page.channels.map((c) =>
            c.id === channelId ? { ...c, ...patch } : c,
          ),
        })),
      };
    },
  );
}

/**
 * Closes the direct thread with `userId` to new messages, wherever it is cached.
 *
 * Removing a contact is keyed on the *user*, not the channel, so the caller has
 * no channel id to aim at — but a channel-detail payload names its `recipient`,
 * which is exactly the direct thread's other party. Walking the
 * `[scope, "channel", "details", …]` family and matching on that leaves every
 * other conversation (and every group) untouched.
 */
export function closeDirectChannelWith(
  queryClient: QueryClient,
  userId: string,
): void {
  queryClient.setQueriesData<InboxChannel>(
    {
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) && key[1] === "channel" && key[2] === "details"
        );
      },
    },
    (channel) => {
      if (!channel || channel.type !== "DIRECT") return channel;
      if (channel.recipient?.id !== userId) return channel;
      // Already closed — don't churn a new object for nothing.
      if (channel.canMessage === false) return channel;

      return { ...channel, canMessage: false };
    },
  );
}

/**
 * Drops a channel from every cached inbox list and decrements that list's total.
 *
 * Used when the viewer leaves a group: their membership is gone, so the channel
 * is no longer theirs to see. A no-op for lists that don't hold it, so a
 * duplicate event can't decrement a total twice.
 */
export function removeInboxChannel(
  queryClient: QueryClient,
  keys: ScopedQueryKeys,
  channelId: string,
): void {
  queryClient.setQueriesData<InboxInfiniteData>(
    { queryKey: inboxListPrefix(keys) },
    (data) => {
      if (!data) return data;

      const present = data.pages.some((page) =>
        page.channels.some((channel) => channel.id === channelId),
      );
      if (!present) return data;

      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          channels: page.channels.filter((channel) => channel.id !== channelId),
          total: Math.max(0, page.total - 1),
        })),
      };
    },
  );
}
