import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type {
  Connection,
  ConnectionUser,
  PaginatedConnections,
  PaginatedContacts,
} from "./connection.types";

type ConnectionsInfiniteData = InfiniteData<PaginatedConnections>;
type ContactsInfiniteData = InfiniteData<PaginatedContacts>;

/**
 * `total` is the server-wide count backing a tab badge and every page carries a
 * copy of it, so an optimistic list patch has to move it too or the badge drifts
 * from the list until the next refetch. Applied to every page to keep them
 * consistent — readers take it off page 0.
 */
function withTotalDelta<TPage extends { total: number }>(
  pages: TPage[],
  delta: number,
): TPage[] {
  return pages.map((page) => ({
    ...page,
    total: Math.max(0, page.total + delta),
  }));
}

/**
 * Removes a connection request from every page of a cached list (received or
 * sent) and decrements the badge total. No-op when the request isn't cached, so
 * a duplicate socket event can't decrement the total twice.
 */
export function removeConnectionRequest(
  queryClient: QueryClient,
  queryKey: QueryKey,
  connectionId: string,
): void {
  queryClient.setQueryData<ConnectionsInfiniteData>(queryKey, (data) => {
    if (!data) return data;

    const present = data.pages.some((page) =>
      page.connections.some((req) => req.id === connectionId),
    );
    if (!present) return data;

    const pages = data.pages.map((page) => ({
      ...page,
      connections: page.connections.filter((req) => req.id !== connectionId),
    }));

    return { ...data, pages: withTotalDelta(pages, -1) };
  });
}

/**
 * Prepends a connection request to the first page of a cached list (received or
 * sent) and increments the badge total. Idempotent: a request already in the
 * cache is left untouched, so a duplicate event can't double-count it.
 */
export function prependConnectionRequest(
  queryClient: QueryClient,
  queryKey: QueryKey,
  connection: Connection,
): void {
  queryClient.setQueryData<ConnectionsInfiniteData>(queryKey, (data) => {
    if (!data) return data;

    const alreadyPresent = data.pages.some((page) =>
      page.connections.some((req) => req.id === connection.id),
    );
    if (alreadyPresent) return data;

    const [firstPage, ...restPages] = data.pages;
    if (!firstPage) return data;

    const pages = [
      { ...firstPage, connections: [connection, ...firstPage.connections] },
      ...restPages,
    ];

    return { ...data, pages: withTotalDelta(pages, 1) };
  });
}

/**
 * Partial query key matching every cached contacts list for the scope — i.e. all
 * search-query variants (`[scope, "connections", "contacts", …]`). Dropping the
 * trailing query turns the exact key into a prefix filter that `setQueriesData`
 * matches against.
 */
export function contactsListPrefix(keys: ScopedQueryKeys): unknown[] {
  return keys.connections.contacts("").slice(0, 3);
}

/**
 * Whether a contact belongs in the results for a search query. Mirrors the
 * backend contacts filter (`name contains query`, case-insensitive); the empty
 * query is the unfiltered list, which matches everyone.
 */
function matchesContactSearch(contact: ConnectionUser, query: string): boolean {
  if (!query) return true;
  return contact.name.toLowerCase().includes(query.toLowerCase());
}

/**
 * Removes a contact from every cached contacts list that holds them, decrementing
 * each list's badge total. Keyed on the *user* id — a contact row is a person,
 * not a connection — and a no-op for lists they aren't in, so a duplicate socket
 * event can't decrement a total twice.
 */
export function removeContactFromLists(
  queryClient: QueryClient,
  keys: ScopedQueryKeys,
  userId: string,
): void {
  queryClient.setQueriesData<ContactsInfiniteData>(
    { queryKey: contactsListPrefix(keys) },
    (data) => {
      if (!data) return data;

      const present = data.pages.some((page) =>
        page.contacts.some((contact) => contact.id === userId),
      );
      if (!present) return data;

      const pages = data.pages.map((page) => ({
        ...page,
        contacts: page.contacts.filter((contact) => contact.id !== userId),
      }));

      return { ...data, pages: withTotalDelta(pages, -1) };
    },
  );
}

/**
 * Prepends a newly accepted contact to the first page of every cached contacts
 * list whose search it matches, incrementing that list's badge total. Lists it
 * doesn't match are left alone — the contact isn't part of their result set, so
 * neither their rows nor their total should move. Idempotent on the contact id.
 */
export function prependContact(
  queryClient: QueryClient,
  keys: ScopedQueryKeys,
  contact: ConnectionUser,
): void {
  // The `setQueriesData` updater isn't handed the query it's updating, and the
  // search term we filter on lives in the key — so walk the matching queries and
  // patch each one by its own key.
  const matching = queryClient
    .getQueryCache()
    .findAll({ queryKey: contactsListPrefix(keys) });

  for (const { queryKey } of matching) {
    const search = queryKey[3];
    if (typeof search !== "string") continue;
    if (!matchesContactSearch(contact, search)) continue;

    queryClient.setQueryData<ContactsInfiniteData>(queryKey, (data) => {
      if (!data) return data;

      const alreadyPresent = data.pages.some((page) =>
        page.contacts.some((c) => c.id === contact.id),
      );
      if (alreadyPresent) return data;

      const [firstPage, ...restPages] = data.pages;
      if (!firstPage) return data;

      const pages = [
        { ...firstPage, contacts: [contact, ...firstPage.contacts] },
        ...restPages,
      ];

      return { ...data, pages: withTotalDelta(pages, 1) };
    });
  }
}
