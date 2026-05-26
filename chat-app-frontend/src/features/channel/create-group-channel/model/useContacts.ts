import { useInfiniteQuery } from "@tanstack/react-query";
import { getContactsApi } from "../api/connections.api";
import type { ConnectionUser, PaginatedContacts } from "@/entities/connection";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/shared/utils/debounce";

export function useContacts(query: string): {
  contacts: ConnectionUser[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 500),
    [],
  );

  useEffect(() => {
    debouncedSetQuery(query);
  }, [query, debouncedSetQuery]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedContacts, unknown, ConnectionUser[]>({
    queryKey: ["contacts", debouncedQuery],
    queryFn: ({ pageParam }) =>
      getContactsApi({
        params: {
          cursor: pageParam,
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
