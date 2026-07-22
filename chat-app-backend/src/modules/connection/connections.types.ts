import type { ConnectionStatus, Notification } from "@/prisma/client";

export interface ConnectionUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

/** An accepted connection reduced to the other party, as the contacts list renders it. */
export interface Contact extends ConnectionUser {
  /** Sort key of the contacts list — also what the keyset cursor seeks on. */
  updatedAt: Date;
}

export interface ConnectionRequest {
  id: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
  /** The counterpart: the receiver on the sent list, the sender on the received list. */
  user: ConnectionUser;
}

export interface PaginatedConnections {
  connections: ConnectionRequest[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total connections matching the status (across all pages), for tab badges. */
  total: number;
}

export interface PaginatedContacts {
  contacts: Contact[];
  hasMore: boolean;
  nextCursor: string | null;
  /** Total contacts matching the search (across all pages), for the tab badge. */
  total: number;
}

export interface ConnectionRequestResponse {
  sentConnection: ConnectionRequest;
  receivedConnection: ConnectionRequest;
  notification: Notification;
}

/** The two endpoints of a connection — a single edge of the contact graph. */
export interface ContactEdge {
  senderId: string;
  receiverId: string;
}

/** A connection row loaded with both parties' profiles, as the write paths return it. */
export interface ConnectionWithParties {
  id: string;
  senderId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
  sender: ConnectionUser;
  receiver: ConnectionUser;
}
