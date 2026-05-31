import type { Connection } from "@/prisma/client";

export interface SuggestedUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  connectionStatus: "STRANGER" | "CONTACT" | "PENDING_SENT" | "PENDING_RECEIVED";
  mutualConnectionsCount: number;
}

export interface PaginatedUsers {
  users: SuggestedUser[];
  hasMore: boolean;
  nextCursor: string | null | undefined;
}

export interface UserWithConnections {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  receivedConnections?: Connection[];
  sentConnections?: Connection[];
}
