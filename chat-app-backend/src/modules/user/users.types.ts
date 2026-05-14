import { User } from "@/prisma/client";

export interface PaginatedUsers {
  users: Partial<User>[];
  hasMore: boolean;
  nextCursor: string | null | undefined;
}
