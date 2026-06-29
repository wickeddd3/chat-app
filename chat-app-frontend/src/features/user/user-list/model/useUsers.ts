import { useQuery } from "@tanstack/react-query";
import { getUsersApi } from "../api/users.api";
import type { User } from "@/entities/user";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/shared/utils/debounce";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useUsers(
  authId?: string,
  query?: string,
): {
  users: User[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
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

  const { data, isLoading, error } = useQuery<User[], unknown, User[]>({
    queryKey: keys.users.recommended(debouncedQuery),
    queryFn: ({ pageParam }) =>
      getUsersApi({
        params: {
          cursor: pageParam as string | number | null,
          ...(debouncedQuery && { query: debouncedQuery }),
        },
      }),
  });

  const users = data ?? [];

  return {
    users,
    isLoading,
    isEmpty: !isLoading && users.length === 0,
    error,
  };
}
