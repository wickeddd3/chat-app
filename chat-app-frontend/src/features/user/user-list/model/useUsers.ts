import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api/users.api";
import type { User } from "@/entities/user";

export function useUsers(): {
  users: User[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  return {
    users: data ?? [],
    isLoading,
    isEmpty: !isLoading && !!!(data && data.length),
    error,
  };
}
