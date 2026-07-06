import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { InboxChannel, PaginatedInboxChannel } from "./channel.types";

type InboxInfiniteData = InfiniteData<PaginatedInboxChannel>;

/**
 * Partial query key matching every cached inbox list for the scope — i.e. all
 * search-query variants (`[scope, "inbox", "list", <query>]`). Dropping the
 * trailing query segment turns the exact key into a prefix filter that
 * `setQueriesData` / `invalidateQueries` match against.
 */
export function inboxListPrefix(keys: ScopedQueryKeys): unknown[] {
  return keys.inbox.list("").slice(0, 3);
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
export function buildOptimisticGroupChannel(id: string, name: string): InboxChannel {
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
export function prependInboxChannel(queryClient: QueryClient, keys: ScopedQueryKeys, channel: InboxChannel): void {
  queryClient.setQueriesData<InboxInfiniteData>({ queryKey: inboxListPrefix(keys) }, (data) => {
    if (!data) return data;

    const alreadyPresent = data.pages.some((page) => page.channels.some((c) => c.id === channel.id));
    if (alreadyPresent) return data;

    const [firstPage, ...restPages] = data.pages;
    if (!firstPage) return data;

    return {
      ...data,
      pages: [{ ...firstPage, channels: [channel, ...firstPage.channels] }, ...restPages],
    };
  });
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
  queryClient.setQueriesData<InboxInfiniteData>({ queryKey: inboxListPrefix(keys) }, (data) => {
    if (!data) return data;

    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        channels: page.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)),
      })),
    };
  });
}
