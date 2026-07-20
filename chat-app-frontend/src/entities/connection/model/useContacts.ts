import { useInfiniteQuery } from "@tanstack/react-query";
import { getContactsApi } from "../api/connections.api";
import type { ConnectionUser, PaginatedContacts } from "./connection.types";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/shared/utils/debounce";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useContacts(
  authId?: string,
  query?: string,
): {
  contacts: ConnectionUser[];
  appliedQuery: string;
  isLoading: boolean;
  isEmpty: boolean;
  total: number;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const keys = createQueryKeys(authId);

  const [debouncedQuery, setDebouncedQuery] = useState(query ?? "");

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 500),
    [],
  );

  useEffect(() => {
    debouncedSetQuery(query ?? "");
  }, [query, debouncedSetQuery]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedContacts>({
    queryKey: keys.connections.contacts(debouncedQuery),
    queryFn: ({ pageParam }) =>
      getContactsApi({
        params: {
          cursor: pageParam as string | number | null,
          ...(debouncedQuery && { query: debouncedQuery }),
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const contacts = useMemo(
    () => data?.pages.flatMap((page) => page.contacts) ?? [],
    [data],
  );

  // Every page reports the same search-wide total; read it off the first page.
  const total = data?.pages[0]?.total ?? 0;

  return {
    contacts,
    appliedQuery: debouncedQuery,
    isLoading,
    isEmpty: !isLoading && contacts.length === 0,
    total,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
