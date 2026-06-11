import { signOut } from "@/shared/lib/supabase-auth";
import { useNavigate } from "react-router";

export function useSignOut() {
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return { logout };
}
