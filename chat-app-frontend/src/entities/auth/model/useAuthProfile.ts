import { useQuery } from "@tanstack/react-query";
import { getAuthProfile } from "../api/auth.api";
import type { AuthUser } from "./auth.types";

export function useAuthProfile(): {
  authProfile: AuthUser | null;
  isLoading: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["authProfile"],
    queryFn: getAuthProfile,
  });

  return {
    authProfile: data || null,
    isLoading,
    error,
  };
}
