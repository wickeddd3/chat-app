import { prisma } from "@/lib/prisma";
import type { User } from "@/prisma/client";
import { PaginatedUsers } from "./users.types";

export class UsersRepository {
  private db = prisma;

  public async list({
    authUserId,
    limit = 20,
    cursor,
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
  }): Promise<PaginatedUsers> {
    try {
      const users = await this.db.user.findMany({
        take: limit,
        where: {
          id: { not: authUserId },
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const hasMore = users.length === limit;
      const nextCursor = hasMore ? users[users.length - 1]?.id : null;

      return {
        users,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve users");
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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve user");
    }
  }
}
