import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient, Prisma } from "@/prisma/client";
import type { ConnectionStatus } from "@/prisma/enums";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { buildKeysetPage, keysetFilter, keysetTake } from "@/shared/persistence/keyset-pagination";
import { USER_PROFILE_SELECT } from "@/shared/persistence/selectors";
import { toConnectionRequest, toContact } from "../connections.mapper";
import type { ContactEdge, PaginatedConnections, PaginatedContacts } from "../connections.types";

/** Descending keyset order: the sort column, then id as a deterministic tiebreaker. */
const BY_UPDATED_AT_DESC = [{ updatedAt: "desc" as const }, { id: "desc" as const }];

/**
 * Read side of the connection module: list projections and counts.
 *
 * Split from `ConnectionsRepository` (which owns writes) because the two share
 * no code and change for different reasons — these queries exist to feed list
 * views, and every one of them is a pure projection with no domain rules.
 */
@injectable()
export class ConnectionsQuery {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  /**
   * Accepted connections, projected down to the *other* party's profile.
   *
   * `total` is computed from the same predicate as the page (minus the cursor)
   * so the tab badge always agrees with the list it labels, including while
   * searching.
   */
  public async getUserContacts({
    authUserId,
    limit = 20,
    cursor = "",
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
  }): Promise<PaginatedContacts> {
    return withPersistence("Failed to retrieve connection contacts.", async () => {
      // The user may be on either side of an accepted connection; the name search
      // always applies to the opposing party.
      const eitherDirection: Prisma.ConnectionWhereInput[] = [
        { senderId: authUserId, receiver: { name: { contains: query, mode: "insensitive" } } },
        { receiverId: authUserId, sender: { name: { contains: query, mode: "insensitive" } } },
      ];

      const [rows, total] = await Promise.all([
        this.db.connection.findMany({
          where: {
            status: "ACCEPTED",
            // The direction/search filter and the keyset predicate are separate
            // OR-groups, so they must be combined under AND — a single object
            // can only hold one OR.
            AND: [{ OR: eitherDirection }, ...keysetFilter<Prisma.ConnectionWhereInput>("updatedAt", cursor)],
          },
          select: {
            id: true,
            updatedAt: true,
            senderId: true,
            receiverId: true,
            sender: { select: USER_PROFILE_SELECT },
            receiver: { select: USER_PROFILE_SELECT },
          },
          take: keysetTake(limit),
          orderBy: BY_UPDATED_AT_DESC,
        }),
        this.db.connection.count({ where: { status: "ACCEPTED", OR: eitherDirection } }),
      ]);

      const page = buildKeysetPage({
        rows,
        limit,
        timestampOf: (row) => row.updatedAt,
        idOf: (row) => row.id,
        map: (row) => toContact(row, authUserId),
      });

      return { contacts: page.items, hasMore: page.hasMore, nextCursor: page.nextCursor, total };
    });
  }

  /** Every accepted counterpart's id — the fan-out set for presence lookups. */
  public async getContactIds(authUserId: string): Promise<string[]> {
    return withPersistence("Failed to retrieve contacts.", async () => {
      const connections = await this.db.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: authUserId }, { receiverId: authUserId }],
        },
        select: { senderId: true, receiverId: true },
        orderBy: { updatedAt: "desc" },
      });

      return connections.map((conn) => (conn.senderId === authUserId ? conn.receiverId : conn.senderId));
    });
  }

  /**
   * Accepted connections among `contactIds` that don't involve `userId` — the
   * second-degree edges of the contact graph, used to rank friend-of-a-friend
   * suggestions. Returns just the endpoints; the caller derives mutual counts.
   */
  public async getContactsOfContacts(userId: string, contactIds: string[]): Promise<ContactEdge[]> {
    return withPersistence("Failed to retrieve contacts of contacts.", () =>
      this.db.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: { in: contactIds } }, { receiverId: { in: contactIds } }],
          // Exclude edges that touch the user directly — those are direct
          // contacts, not suggestions.
          NOT: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { senderId: true, receiverId: true },
      }),
    );
  }

  /** Requests sent BY the user, projected onto the target receiver's profile. */
  public async getSentConnections({
    authUserId,
    limit = 20,
    cursor = "",
    status = "PENDING",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    status?: ConnectionStatus;
  }): Promise<PaginatedConnections> {
    return withPersistence("Failed to retrieve sent connection requests.", async () => {
      const baseWhere: Prisma.ConnectionWhereInput = { senderId: authUserId, status };

      const [rows, total] = await Promise.all([
        this.db.connection.findMany({
          where: {
            ...baseWhere,
            AND: keysetFilter<Prisma.ConnectionWhereInput>("updatedAt", cursor),
          },
          include: { receiver: { select: USER_PROFILE_SELECT } },
          take: keysetTake(limit),
          orderBy: BY_UPDATED_AT_DESC,
        }),
        this.db.connection.count({ where: baseWhere }),
      ]);

      const page = buildKeysetPage({
        rows,
        limit,
        timestampOf: (row) => row.updatedAt,
        idOf: (row) => row.id,
        map: (row) => toConnectionRequest(row, row.receiver),
      });

      return { connections: page.items, hasMore: page.hasMore, nextCursor: page.nextCursor, total };
    });
  }

  /** Requests received BY the user, projected onto the originating sender's profile. */
  public async getReceivedConnections({
    authUserId,
    limit = 20,
    cursor = "",
    status = "PENDING",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    status?: ConnectionStatus;
  }): Promise<PaginatedConnections> {
    return withPersistence("Failed to retrieve received connection requests.", async () => {
      const baseWhere: Prisma.ConnectionWhereInput = { receiverId: authUserId, status };

      const [rows, total] = await Promise.all([
        this.db.connection.findMany({
          where: {
            ...baseWhere,
            AND: keysetFilter<Prisma.ConnectionWhereInput>("updatedAt", cursor),
          },
          include: { sender: { select: USER_PROFILE_SELECT } },
          take: keysetTake(limit),
          orderBy: BY_UPDATED_AT_DESC,
        }),
        this.db.connection.count({ where: baseWhere }),
      ]);

      const page = buildKeysetPage({
        rows,
        limit,
        timestampOf: (row) => row.updatedAt,
        idOf: (row) => row.id,
        map: (row) => toConnectionRequest(row, row.sender),
      });

      return { connections: page.items, hasMore: page.hasMore, nextCursor: page.nextCursor, total };
    });
  }

  public async getReceivedConnectionsCount({ authUserId }: { authUserId: string }): Promise<number> {
    return withPersistence("Failed to retrieve received connection requests count.", () =>
      this.db.connection.count({ where: { receiverId: authUserId, status: "PENDING" } }),
    );
  }
}
