import { prisma } from "@/lib/prisma";
import type { Message } from "@/prisma/client";

export class MessagesRepository {
  private db = prisma;

  public async create(data: {
    content: string;
    channelId: number;
    authorId: string;
  }): Promise<Message & { author: { id: string; name: string; image: string | null } }> {
    try {
      return await this.db.message.create({
        data,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create message");
    }
  }

  public async getMessages(channelId: number): Promise<Partial<Message[]>> {
    try {
      const messages = await this.db.message.findMany({
        where: { channelId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      return messages as Partial<Message[]>;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve messages");
    }
  }
}
