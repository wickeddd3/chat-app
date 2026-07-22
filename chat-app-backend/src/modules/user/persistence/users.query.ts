import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { USER_PROFILE_SELECT } from "@/shared/persistence/selectors";
import type { UserProfile, UserWithConnections } from "../users.types";

/**
 * Read side of the user module: user-table lookups.
 *
 * The contact-graph reads that feed suggestions live in `ConnectionsQuery` (the
 * connection module owns that table); this class only touches `user`.
 */
@injectable()
export class UsersQuery {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  /**
   * Users to offer the caller, with the relationship edges needed to compute a
   * connection-status badge per result.
   *
   * With a search `query`, matches by name. Without one (the initial load),
   * excludes people the caller is already connected to, so the list is fresh
   * candidates the ranking then orders by mutual connections.
   */
  public async search({
    userId,
    limit = 20,
    query = "",
  }: {
    userId: string;
    limit?: number;
    query?: string;
  }): Promise<UserWithConnections[]> {
    return withPersistence("Failed to retrieve search results.", () =>
      this.db.user.findMany({
        take: limit,
        where: {
          id: { not: userId },
          ...(query && { name: { contains: query, mode: "insensitive" } }),
          ...(!query && {
            NOT: [
              { sentConnections: { some: { receiverId: userId, status: "ACCEPTED" } } },
              { receivedConnections: { some: { senderId: userId, status: "ACCEPTED" } } },
            ],
          }),
        },
        select: {
          ...USER_PROFILE_SELECT,
          // The caller's own edge with each result, to derive the status badge.
          sentConnections: { where: { OR: [{ senderId: userId }, { receiverId: userId }] } },
          receivedConnections: { where: { OR: [{ senderId: userId }, { receiverId: userId }] } },
        },
        orderBy: { createdAt: "asc" },
      }),
    );
  }

  public async getByUsername(username: string): Promise<UserProfile | null> {
    return withPersistence("Failed to retrieve user.", () =>
      this.db.user.findUnique({ where: { username }, select: USER_PROFILE_SELECT }),
    );
  }
}
