import type { Connection } from "@/prisma/client";

/** The public profile fields projected for a user (matches USER_PROFILE_SELECT). */
export interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

export interface SuggestedUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  connectionStatus: "STRANGER" | "CONTACT" | "PENDING_SENT" | "PENDING_RECEIVED";
  connectionId: string | null;
  mutualConnectionsCount: number;
}

export interface UserWithConnections {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  receivedConnections?: Connection[];
  sentConnections?: Connection[];
}
