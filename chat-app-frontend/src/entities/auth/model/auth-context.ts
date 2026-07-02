import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  session: Session | null;
  authUser: User | null;
  authUserLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
