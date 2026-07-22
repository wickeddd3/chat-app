import { createContext } from "react";

/** A single user's presence: online/offline plus, for offline users, when they were last seen. */
export interface PresenceEntry {
  status: "online" | "offline";
  // ISO timestamp; null while online, or when no last-seen has been recorded yet.
  lastSeen: string | null;
}

export interface PresenceContextType {
  presenceMap: Record<string, PresenceEntry>;
  isOnline: (userId: string) => boolean;
  /** The ISO last-seen for an offline user, or null if online / unknown. */
  getLastSeen: (userId: string) => string | null;
}

export const PresenceContext = createContext<PresenceContextType | undefined>(
  undefined,
);
