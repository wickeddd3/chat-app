import { usePresenceMap } from "@/features/message/online-presence";
import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

interface PresenceContextType {
  presenceMap: Record<string, "online" | "offline">;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(
  undefined,
);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authUser } = useAuth();
  const { presenceMap } = usePresenceMap(authUser?.id);

  const isOnline = useCallback(
    (userId: string) => presenceMap[userId] === "online",
    [presenceMap],
  );

  const value = useMemo(
    () => ({ presenceMap, isOnline }),
    [presenceMap, isOnline],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context)
    throw new Error("usePresence must be used within PresenceProvider");
  return context;
};
