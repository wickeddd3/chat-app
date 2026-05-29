import { prisma } from "@/lib/prisma";
import type { ConnectionStatus } from "@/prisma/enums";
import type { PaginatedConnections, PaginatedContacts } from "./connections.types";

export class ConnectionsRepository {
  private db = prisma;

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
      // Fetch all accepted connections where the user is either sender or receiver
      const connections = await this.db.connection.findMany({
        where: {
          status: "ACCEPTED",
          AND: [
            {
              OR: [
                { senderId: authUserId, receiver: { name: { contains: query, mode: "insensitive" } } },
                { receiverId: authUserId, sender: { name: { contains: query, mode: "insensitive" } } },
              ],
            },
          ],
          ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
        },
        select: {
          updatedAt: true,
          senderId: true,
          receiverId: true,
          sender: { select: { id: true, name: true, username: true, image: true } },
          receiver: { select: { id: true, name: true, username: true, image: true } },
        },
        take: limit,
      });

      // Map the connection payload down to just the opposing User profile object
      const contacts = connections.map((conn) => {
        return {
          ...(conn.senderId === authUserId ? conn.receiver : conn.sender),
          updatedAt: conn.updatedAt,
        };
      });

      const hasMore = connections.length === limit;
      const nextCursor = hasMore ? connections[connections.length - 1]?.updatedAt?.toISOString() : null;

      return {
        contacts: contacts,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve connection contacts");
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
      const connections = await this.db.connection.findMany({
        where: {
          senderId: authUserId,
          ...(status && { status }), // Optional status filter (e.g., PENDING or ACCEPTED)
          ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
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
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      // Flatten payload so it yields cleanly: { connectionId, status, user: receiverProfile }
      const sentConnections = connections.map((conn) => ({
        id: conn.id,
        status: conn.status,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        user: conn.receiver,
      }));

      const hasMore = connections.length === limit;
      const nextCursor = hasMore ? connections[connections.length - 1]?.updatedAt?.toISOString() : null;

      return {
        connections: sentConnections,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve sent connection requests");
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
      const connections = await this.db.connection.findMany({
        where: {
          receiverId: authUserId,
          ...(status && { status }),
          ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
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
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      // Flatten payload so it yields cleanly: { connectionId, status, user: senderProfile }
      const receivedConnections = connections.map((conn) => ({
        id: conn.id,
        status: conn.status,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        user: conn.sender,
      }));

      const hasMore = connections.length === limit;
      const nextCursor = hasMore ? connections[connections.length - 1]?.updatedAt?.toISOString() : null;

      return {
        connections: receivedConnections,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve received connection requests");
    }
  }

  public async sendRequest(senderId: string, receiverId: string) {
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
          include: { sender: true },
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

        return { connection, notification };
      });

      return result;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to send connection request");
    }
  }

  public async acceptRequest(receiverId: string, connectionId: string) {
    try {
      return await this.db.$transaction(async (tx) => {
        const connection = await tx.connection.findUnique({
          where: { id: connectionId },
        });

        if (!connection || connection.receiverId !== receiverId) {
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
          connection: {
            id: updatedConnection.id,
            status: updatedConnection.status,
            createdAt: updatedConnection.createdAt,
            updatedAt: updatedConnection.updatedAt,
            user: updatedConnection.sender,
          },
          notification,
        };
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to accept connection request");
    }
  }

  /**
   * DECLINE: Run by the recipient of an incoming request.
   * Target connection must be directed to the active user and currently be 'PENDING'.
   */
  public async declineRequest(receiverId: string, connectionId: string): Promise<void> {
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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to decline connection request");
    }
  }

  /**
   * CANCEL: Run by the author of an outbound request.
   * Target connection must originate from the active user and still be 'PENDING'.
   */
  public async cancelRequest(senderId: string, connectionId: string): Promise<void> {
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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to cancel connection request");
    }
  }
}
