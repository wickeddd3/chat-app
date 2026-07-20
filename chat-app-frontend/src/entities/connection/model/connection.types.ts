export interface ConnectionUser {
  id: string;
  name: string;
  username: string;
  image?: string | null;
  updatedAt?: string;
}

export type ConnectionStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Connection {
  id: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
  user: ConnectionUser;
}

export interface PaginatedConnections {
  connections: Connection[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total pending requests in this direction, across all pages (for tab badges). */
  total: number;
}

export interface PaginatedContacts {
  contacts: ConnectionUser[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total contacts matching the search, across all pages (for the tab badge). */
  total: number;
}
