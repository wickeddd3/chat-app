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
  isLoading: boolean;
  isEmpty: boolean;
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
  } = useInfiniteQuery<PaginatedContacts, unknown, ConnectionUser[]>({
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
    select: (data) => data.pages.flatMap((page) => page.contacts),
  });

  const contacts = data ?? [];

  return {
    contacts,
    isLoading,
    isEmpty: !isLoading && contacts.length === 0,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
