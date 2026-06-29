import { useQuery } from "@tanstack/react-query";
import { getAuthProfile } from "../api/auth.api";
import type { AuthUser } from "./auth.types";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useAuthProfile(authId?: string): {
  authProfile: AuthUser | null;
  isLoading: boolean;
  error: unknown;
} {
  const keys = createQueryKeys(authId);

  const { data, isLoading, error } = useQuery({
    queryKey: keys.authProfile.details(),
    queryFn: getAuthProfile,
  });

  return {
    authProfile: data || null,
    isLoading,
    error,
  };
}
