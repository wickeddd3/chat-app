import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase.client";

interface AuthContextType {
  session: Session | null;
  authUser: User | null;
  authUserLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUserLoading, setAuthUserLoading] = useState(true);

  useEffect(() => {
    // Get the initial session status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      setAuthUserLoading(false);
    });

    // Listen for authentication changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setAuthUser(session?.user ?? null);
        setAuthUserLoading(false);
      },
    );

    // Cleanup the subscription listener on component unmount
    return () => {
      if (listener) listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, authUser, authUserLoading }),
    [session, authUser, authUserLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
