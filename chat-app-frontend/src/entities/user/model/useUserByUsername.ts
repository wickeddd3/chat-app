import { useQuery } from "@tanstack/react-query";
import { getUserByUsername } from "../api/user.api";
import type { User } from "@/entities/user";

export function useUserByUsername(username: string | undefined): {
  data: Partial<User> | undefined | null;
  isLoading: boolean;
  error: unknown;
} {
  return useQuery({
    queryKey: ["user", username],
    queryFn: async () => {
      if (!username) return null;

      const cleanUsername = username.replace("@", ""); // Strip the '@' from the param

      return await getUserByUsername(cleanUsername);
    },
    enabled: !!username,
  });
}
