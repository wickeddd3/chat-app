import { useInfiniteQuery } from "@tanstack/react-query";
import { getUsers } from "../api/users.api";
import type { PaginatedUsers, User } from "@/entities/user";

export function useUsers(): {
  users: User[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedUsers, unknown, User[]>({
    queryKey: ["users"],
    queryFn: ({ pageParam }) => getUsers(pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.users),
  });

  return {
    users: data ?? [],
    isLoading,
    isEmpty: !isLoading && !!!(data && data.length),
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
