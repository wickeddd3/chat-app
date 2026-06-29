import { signOut } from "@/shared/lib/supabase-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = async () => {
    await signOut();

    queryClient.clear(); // Wipe of the TanStack Query In-Memory Cache

    navigate("/");
  };

  return { logout };
}
