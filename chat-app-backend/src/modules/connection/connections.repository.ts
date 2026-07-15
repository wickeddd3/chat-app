import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { ConnectionStatus } from "@/prisma/enums";
import type { ConnectionRequestResponse, PaginatedConnections, PaginatedContacts } from "./connections.types";
import { HttpException } from "@/utils/http.exception";
import { decodeCursor, encodeCursor } from "@/utils/cursor";

@injectable()
export class ConnectionsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

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
    try {
      const decoded = decodeCursor(cursor);
      // Accepted connections where the user is either sender or receiver, narrowed
      // by the name search. Shared by the page query and the total count so the
      // badge always agrees with the list it labels (including while searching).
      // The keyset cursor is layered on separately — only the page query paginates.
      const baseWhere = {
        status: "ACCEPTED" as const,
        OR: [
          { senderId: authUserId, receiver: { name: { contains: query, mode: "insensitive" as const } } },
          { receiverId: authUserId, sender: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      };

      const [connections, total] = await Promise.all([
        this.db.connection.findMany({
          where: {
            status: baseWhere.status,
            // The search filter and the keyset cursor are separate OR-groups, so
            // they must be combined under AND (a single object can hold one OR).
            AND: [
              { OR: baseWhere.OR },
              // Keyset cursor: (updatedAt, id) strictly before the boundary.
              ...(decoded
                ? [
                    {
                      OR: [
                        { updatedAt: { lt: decoded.timestamp } },
                        { updatedAt: decoded.timestamp, id: { lt: decoded.id } },
                      ],
                    },
                  ]
                : []),
            ],
          },
          select: {
            id: true,
            updatedAt: true,
            senderId: true,
            receiverId: true,
            sender: { select: { id: true, name: true, username: true, image: true } },
            receiver: { select: { id: true, name: true, username: true, image: true } },
          },
          // Fetch one extra to reliably determine hasMore.
          take: limit + 1,
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        }),
        this.db.connection.count({ where: baseWhere }),
      ]);

      const hasMore = connections.length > limit;
      const pageItems = hasMore ? connections.slice(0, limit) : connections;

      // Map the connection payload down to just the opposing User profile object
      const contacts = pageItems.map((conn) => {
        return {
          ...(conn.senderId === authUserId ? conn.receiver : conn.sender),
          updatedAt: conn.updatedAt,
        };
      });

      const lastItem = pageItems.at(-1);
      const nextCursor = hasMore && lastItem ? encodeCursor(lastItem.updatedAt, lastItem.id) : null;

      return {
        contacts: contacts,
        hasMore,
        nextCursor,
        total,
      };
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve connection contacts.", null, { cause: error });
    }
  }

  public async getRawContactIds(authUserId: string): Promise<string[]> {
    try {
      // Fetch all accepted connections where the user is either sender or receiver
      const connections = await this.db.connection.findMany({
        where: {
          status: "ACCEPTED",
          AND: [
            {
              OR: [{ senderId: authUserId }, { receiverId: authUserId }],
            },
          ],
        },
        select: {
          updatedAt: true,
          senderId: true,
          receiverId: true,
          sender: { select: { id: true } },
          receiver: { select: { id: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      const contacts = connections.map((conn) => (conn.senderId === authUserId ? conn.receiver.id : conn.sender.id));

      return contacts;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve contacts.", null, { cause: error });
    }
  }

  /**
   * Fetch all connections SENT BY the current user.
   * Maps data so the frontend receives the profile details of the Target Receiver.
   */

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
    try {
      const decoded = decodeCursor(cursor);
      const connections = await this.db.connection.findMany({
        where: {
          senderId: authUserId,
          status,
          // Keyset cursor: (updatedAt, id) strictly before the boundary.
          ...(decoded && {
            OR: [{ updatedAt: { lt: decoded.timestamp } }, { updatedAt: decoded.timestamp, id: { lt: decoded.id } }],
          }),
        },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        // Fetch one extra to reliably determine hasMore.
        take: limit + 1,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });

      const hasMore = connections.length > limit;
      const pageItems = hasMore ? connections.slice(0, limit) : connections;

      // Flatten payload so it yields cleanly: { connectionId, status, user: receiverProfile }
      const sentConnections = pageItems.map((conn) => ({
        id: conn.id,
        status: conn.status,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        user: conn.receiver,
      }));

      const lastItem = pageItems.at(-1);
      const nextCursor = hasMore && lastItem ? encodeCursor(lastItem.updatedAt, lastItem.id) : null;

      return {
        connections: sentConnections,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve sent connection requests.", null, { cause: error });
    }
  }

  /**
   * Fetch all connections RECEIVED BY the current user.
   * Maps data so the frontend receives the profile details of the Target Sender.
   */
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
    try {
      const decoded = decodeCursor(cursor);
      const connections = await this.db.connection.findMany({
        where: {
          receiverId: authUserId,
          status,
          // Keyset cursor: (updatedAt, id) strictly before the boundary.
          ...(decoded && {
            OR: [{ updatedAt: { lt: decoded.timestamp } }, { updatedAt: decoded.timestamp, id: { lt: decoded.id } }],
          }),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        // Fetch one extra to reliably determine hasMore.
        take: limit + 1,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });

      const hasMore = connections.length > limit;
      const pageItems = hasMore ? connections.slice(0, limit) : connections;

      // Flatten payload so it yields cleanly: { connectionId, status, user: senderProfile }
      const receivedConnections = pageItems.map((conn) => ({
        id: conn.id,
        status: conn.status,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        user: conn.sender,
      }));

      const lastItem = pageItems.at(-1);
      const nextCursor = hasMore && lastItem ? encodeCursor(lastItem.updatedAt, lastItem.id) : null;

      return {
        connections: receivedConnections,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve received connection requests.", null, { cause: error });
    }
  }

  public async getReceivedConnectionsCount({ authUserId }: { authUserId: string }): Promise<number> {
    try {
      const pendingRequestsCount = await this.db.connection.count({
        where: {
          receiverId: authUserId,
          status: "PENDING",
        },
      });

      return pendingRequestsCount;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve received connection requests count.", null, { cause: error });
    }
  }

  public async sendRequest(senderId: string, receiverId: string): Promise<ConnectionRequestResponse> {
    try {
      if (senderId === receiverId) throw new Error("You cannot connect with yourself");

      // Check if a connection record already exists in either direction
      const existing = await this.db.connection.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });

      if (existing) throw new Error("Connection request already exists or you are connected");

      // Create connection and notification together in a transaction
      const result = await this.db.$transaction(async (tx) => {
        const connection = await tx.connection.create({
          data: { senderId, receiverId, status: "PENDING" },
          include: {
            receiver: { select: { id: true, name: true, username: true, image: true } },
            sender: { select: { id: true, name: true, username: true, image: true } },
          },
        });

        const notification = await tx.notification.create({
          data: {
            userId: receiverId,
            type: "CONNECTION_REQUEST",
            title: "New Connection Request",
            content: `${connection.sender.name} wants to connect with you.`,
            referenceId: connection.id,
          },
        });

        return {
          sentConnection: {
            id: connection.id,
            status: connection.status,
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt,
            user: connection.receiver,
          },
          receivedConnection: {
            id: connection.id,
            status: connection.status,
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt,
            user: connection.sender,
          },
          notification,
        };
      });

      return result;
    } catch (error) {
      throw new HttpException(500, "Failed to send connection request.", null, { cause: error });
    }
  }

  public async acceptRequest(receiverId: string, connectionId: string): Promise<ConnectionRequestResponse> {
    try {
      return await this.db.$transaction(async (tx) => {
        const connection = await tx.connection.findUnique({
          where: { id: connectionId },
        });

        if (connection?.receiverId !== receiverId) {
          throw new Error("Unauthorized or invalid connection record");
        }

        const updatedConnection = await tx.connection.update({
          where: { id: connectionId },
          data: { status: "ACCEPTED" },
          include: {
            receiver: { select: { id: true, name: true, username: true, image: true } },
            sender: { select: { id: true, name: true, username: true, image: true } },
          },
        });

        // Mark the original incoming request notification as read
        await tx.notification.updateMany({
          where: { referenceId: connectionId, userId: receiverId },
          data: { isRead: true },
        });

        // Alert the sender that their request was accepted
        const notification = await tx.notification.create({
          data: {
            userId: connection.senderId,
            type: "CONNECTION_ACCEPTED",
            title: "Connection Accepted",
            content: `${updatedConnection.receiver.name} accepted your connection request.`,
            referenceId: connectionId,
          },
        });

        return {
          sentConnection: {
            id: updatedConnection.id,
            status: updatedConnection.status,
            createdAt: updatedConnection.createdAt,
            updatedAt: updatedConnection.updatedAt,
            user: updatedConnection.receiver,
          },
          receivedConnection: {
            id: updatedConnection.id,
            status: updatedConnection.status,
            createdAt: updatedConnection.createdAt,
            updatedAt: updatedConnection.updatedAt,
            user: updatedConnection.sender,
          },
          notification,
        };
      });
    } catch (error) {
      throw new HttpException(500, "Failed to accept connection request.", null, { cause: error });
    }
  }

  /**
   * DECLINE: Run by the recipient of an incoming request.
   * Target connection must be directed to the active user and currently be 'PENDING'.
   */
  public async declineRequest(receiverId: string, connectionId: string): Promise<string> {
    try {
      // 1. Find the target record to verify authorization and status rules
      const connection = await this.db.connection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error("Connection request not found");
      }

      // Security check: Verify that the current user is actually the receiver
      if (connection.receiverId !== receiverId) {
        throw new Error("Unauthorized: You cannot decline a request sent to someone else");
      }

      // Business logic check: You can only decline pending requests
      if (connection.status !== "PENDING") {
        throw new Error(`Cannot decline request with status: ${connection.status}`);
      }

      // 2. Perform cleanup across the database atomically
      await this.db.$transaction([
        // Delete the connection relation record
        this.db.connection.delete({
          where: { id: connectionId },
        }),
        // Clean up the related unread connection request notification
        this.db.notification.deleteMany({
          where: {
            referenceId: connectionId,
            userId: receiverId,
            type: "CONNECTION_REQUEST",
          },
        }),
      ]);

      return connection.senderId;
    } catch (error) {
      throw new HttpException(500, "Failed to decline connection request.", null, { cause: error });
    }
  }

  /**
   * CANCEL: Run by the author of an outbound request.
   * Target connection must originate from the active user and still be 'PENDING'.
   */
  public async cancelRequest(senderId: string, connectionId: string): Promise<string> {
    try {
      // 1. Find the target record to verify authorization and status rules
      const connection = await this.db.connection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error("Connection request not found");
      }

      // Security check: Verify that the current user is the original sender
      if (connection.senderId !== senderId) {
        throw new Error("Unauthorized: You cannot cancel a request sent by someone else");
      }

      // Business logic check: Once accepted, a request must be unfriended, not cancelled
      if (connection.status !== "PENDING") {
        throw new Error("Cannot cancel a request that has already been accepted or handled");
      }

      // 2. Perform cleanup across tables atomically
      await this.db.$transaction([
        this.db.connection.delete({
          where: { id: connectionId },
        }),
        // Clean up the notification from the recipient's inbox so it disappears
        this.db.notification.deleteMany({
          where: {
            referenceId: connectionId,
            userId: connection.receiverId,
            type: "CONNECTION_REQUEST",
          },
        }),
      ]);

      return connection.receiverId;
    } catch (error) {
      throw new HttpException(500, "Failed to cancel connection request.", null, { cause: error });
    }
  }
}
