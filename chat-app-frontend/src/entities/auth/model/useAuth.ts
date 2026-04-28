import { authClient } from "@/shared/lib/better-auth.client";

export function useAuth() {
  const { data, isPending } = authClient.useSession();

  return {
    authSession: data?.session,
    authUser: data?.user,
    authId: data?.user?.id,
    isAuthPending: isPending,
  };
}
