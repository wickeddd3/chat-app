import { prisma } from "@/lib/prisma";
import type { User } from "@/prisma/client";

export class UsersRepository {
  private db = prisma;

  public async list(): Promise<Partial<User[]>> {
    try {
      const users = await this.db.user.findMany({
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
