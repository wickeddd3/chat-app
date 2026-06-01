import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { User, Connection } from "@/prisma/client";
import type { UserWithConnections } from "./users.types";
import { HttpException } from "@/utils/http.exception";

@injectable()
export class UsersRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async getContactIds(userId: string): Promise<string[]> {
    try {
      const contacts = await this.db.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      });

      const contactIds = contacts.map((c) => (c.senderId === userId ? c.receiverId : c.senderId));

      return contactIds;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve contact IDs.");
    }
  }

  public async getContactIdsContacts(userId: string, contactIds: string[]): Promise<Connection[]> {
    try {
      const contacts = await this.db.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: { in: contactIds } }, { receiverId: { in: contactIds } }],
          NOT: [{ senderId: userId }, { receiverId: userId }],
        },
      });

      return contacts;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve contact of contacts");
    }
  }

  public async search({
    userId,
    limit = 20,
    query = "",
  }: {
    userId: string;
    limit?: number;
    query?: string;
  }): Promise<UserWithConnections[]> {
    try {
      const results = await this.db.user.findMany({
        take: limit,
        where: {
          id: { not: userId },
          ...(query && {
            name: { contains: query, mode: "insensitive" },
          }),
          ...(!query && {
            NOT: [
              { sentConnections: { some: { receiverId: userId, status: "ACCEPTED" } } },
              { receivedConnections: { some: { senderId: userId, status: "ACCEPTED" } } },
            ],
          }),
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          // Fetch relationship intersections to compute relation badges on the fly
          sentConnections: {
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
          },
          receivedConnections: {
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return results;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve search results.");
    }
  }

  public async getByUsername(username: string): Promise<Partial<User> | null> {
    try {
      return await this.db.user.findUnique({
        where: { username: username },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      });
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve user.");
    }
  }
}
