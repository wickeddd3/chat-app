import { prisma } from "@/lib/prisma";
import type { User } from "@/prisma/client";

export class UsersRepository {
  private db = prisma;

  public async list(authUserId: string): Promise<Partial<User[]>> {
    try {
      const users = await this.db.user.findMany({
        where: { id: { not: authUserId } },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        orderBy: { createdAt: "asc" },
      });

      return users as Partial<User[]>;
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
