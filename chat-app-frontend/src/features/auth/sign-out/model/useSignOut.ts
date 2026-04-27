import { authClient } from "@/shared/lib/better-auth.client";
import { useNavigate } from "react-router";

export function useSignOut() {
  const navigate = useNavigate();

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/auth/sign-in");
        },
      },
    });
  };

  return { logout };
}
