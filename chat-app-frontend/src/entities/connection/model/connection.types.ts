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
}

export interface PaginatedContacts {
  contacts: ConnectionUser[];
  hasMore: boolean;
  nextCursor: string | null;
}
