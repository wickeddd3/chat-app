import type { Connection, User } from "@/prisma/client";

export interface PaginatedConnections {
  connections: Partial<Connection>[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PaginatedContacts {
  contacts: Partial<User>[];
  hasMore: boolean;
  nextCursor: string | null;
}
