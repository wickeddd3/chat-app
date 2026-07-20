import type { QueryClient } from "@tanstack/react-query";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { User } from "./user.types";

/**
 * Partial query key matching every cached recommended-users list for the scope —
 * i.e. all search-query variants (`[scope, "users", "recommended", …]`). Dropping
 * the trailing query turns the exact key into a prefix filter that
 * `setQueriesData` matches against.
 */
export function recommendedUsersPrefix(keys: ScopedQueryKeys): unknown[] {
  return keys.users.recommended("").slice(0, 3);
}

/**
 * Applies a partial patch to a user wherever they appear across every cached
 * recommended-users list, so a connection action taken from one search result
 * doesn't leave a stale status behind in the other cached queries. No-op for
 * lists that don't contain the id.
 */
export function patchRecommendedUser(
  queryClient: QueryClient,
  keys: ScopedQueryKeys,
  userId: string,
  patch: Partial<User>,
): void {
  queryClient.setQueriesData<User[]>(
    { queryKey: recommendedUsersPrefix(keys) },
    (users) => {
      if (!users) return users;
      if (!users.some((user) => user.id === userId)) return users;

      return users.map((user) =>
        user.id === userId ? { ...user, ...patch } : user,
      );
    },
  );
}
