import { prisma } from "@/lib/prisma";
import type { Message } from "@/prisma/client";

export class MessagesRepository {
  private db = prisma;

  public async getMessagesByRoomId(roomId: string): Promise<Partial<Message[]>> {
    try {
      const messages = await this.db.message.findMany({
        where: { roomId },
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

  public async getInbox(userId: string) {
    const conversations = await this.db.message.findMany({
      where: { roomId: { contains: userId } },
      orderBy: { createdAt: "desc" },
      distinct: ["roomId"],
    });

    return Promise.all(
      conversations.map(async (msg) => {
        const otherUserId = msg.roomId.split("--").find((id) => id !== userId);
        const otherUser = await this.db.user.findUnique({
          where: { id: otherUserId || "" },
          select: { id: true, name: true, image: true, username: true },
        });

        return {
          roomId: msg.roomId,
          lastMessage: msg.content,
          updatedAt: msg.createdAt,
          otherUser,
        };
      }),
    );
  }

  public async create(data: {
    content: string;
    roomId: string;
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
}
