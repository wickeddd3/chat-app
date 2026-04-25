import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api/users.api";
import type { User } from "@/entities/user";

export function useUsers(): {
  data: Partial<User[]> | undefined;
  isLoading: boolean;
  error: unknown;
} {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
}
