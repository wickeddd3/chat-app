import { Connection } from "@/prisma/client";

export interface PaginatedConnections {
  connections: Partial<Connection>[];
  hasMore: boolean;
  nextCursor: string | null | undefined;
}
