import React, { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { usePresenceMap } from "./usePresenceMap";
import { PresenceContext } from "./presence-context";

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
