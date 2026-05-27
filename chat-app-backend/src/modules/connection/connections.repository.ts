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

  public async sendConnectionRequest(senderId: string, receiverId: string) {
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
      return await this.db.$transaction(async (tx) => {
        const connection = await tx.connection.create({
          data: { senderId, receiverId, status: "PENDING" },
          include: { sender: true },
        });

        await tx.notification.create({
          data: {
            userId: receiverId,
            type: "CONNECTION_REQUEST",
            title: "New Connection Request",
            content: `${connection.sender.name} wants to connect with you.`,
            referenceId: connection.id,
          },
        });

        // Real-time step: Emit a WebSocket event to the receiverId room here!
        // io.to(receiverId).emit("new_notification", ...);

        return connection;
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to send connection request");
    }
  }

  public async acceptConnectionRequest(receiverId: string, connectionId: string) {
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
          include: { receiver: true },
        });

        // Mark the original incoming request notification as read
        await tx.notification.updateMany({
          where: { referenceId: connectionId, userId: receiverId },
          data: { isRead: true },
        });

        // Alert the sender that their request was accepted
        await tx.notification.create({
          data: {
            userId: connection.senderId,
            type: "CONNECTION_ACCEPTED",
            title: "Connection Accepted",
            content: `${updatedConnection.receiver.name} accepted your connection request.`,
            referenceId: connectionId,
          },
        });

        return updatedConnection;
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to accept connection request");
    }
  }
}
