import { useInfiniteQuery } from "@tanstack/react-query";
import { getUsers } from "../api/users.api";
import type { PaginatedUsers, User } from "@/entities/user";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/shared/utils/debounce";

export function useUsers(query: string): {
  users: User[];
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
  } = useInfiniteQuery<PaginatedUsers, unknown, User[]>({
    queryKey: ["users", debouncedQuery],
    queryFn: ({ pageParam }) =>
      getUsers({
        params: {
          cursor: pageParam,
          ...(debouncedQuery && { query: debouncedQuery }),
        },
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.users),
  });

  const users = data ?? [];

  return {
    users,
    isLoading,
    isEmpty: !isLoading && users.length === 0,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
