import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
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
 * Prepends a newly accepted contact to the first page of the unfiltered contacts
 * list and increments its badge total. Idempotent on the contact id.
 */
export function prependContact(
  queryClient: QueryClient,
  queryKey: QueryKey,
  contact: ConnectionUser,
): void {
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
