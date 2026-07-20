import type { Connection, ConnectionStatus, User, Notification } from "@/prisma/client";

export interface PaginatedConnections {
  connections: Partial<Connection>[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total connections matching the status (across all pages), for tab badges. */
  total: number;
}

export interface PaginatedContacts {
  contacts: Partial<User>[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total contacts matching the search (across all pages), for the tab badge. */
  total: number;
}

export interface ConnectionUser {
  name: string;
  id: string;
  image: string | null;
  username: string | null;
}

export interface ConnectionRequest {
  id: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
  user: ConnectionUser;
}

export interface ConnectionRequestResponse {
  sentConnection: ConnectionRequest;
  receivedConnection: ConnectionRequest;
  notification: Notification;
}
