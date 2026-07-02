import { createContext } from "react";

export interface PresenceContextType {
  presenceMap: Record<string, "online" | "offline">;
  isOnline: (userId: string) => boolean;
}

export const PresenceContext = createContext<PresenceContextType | undefined>(
  undefined,
);
