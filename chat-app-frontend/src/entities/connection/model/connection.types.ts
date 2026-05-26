export interface ConnectionUser {
  id: string;
  name: string;
  image?: string | null;
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
  nextCursor: string | null | undefined;
}

export interface PaginatedContacts {
  contacts: ConnectionUser[];
  hasMore: boolean;
  nextCursor: string | null | undefined;
}
