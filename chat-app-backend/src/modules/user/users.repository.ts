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
          email: true,
          image: true,
        },
        orderBy: { createdAt: "asc" },
      });

      return users as Partial<User[]>;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve users");
    }
  }
}
