import { prisma } from "@/lib/prisma";
import type { Channel } from "@/prisma/client";

export class ChannelsRepository {
  private db = prisma;

  public async findExistingDirectChannel(userId: string, targetUserId: string): Promise<Channel | null> {
    try {
      const existing = await prisma.channel.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { channelMembers: { some: { userId: userId } } },
            { channelMembers: { some: { userId: targetUserId } } },
          ],
        },
      });

      return existing;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to check direct channel");
    }
  }

  public async createDirectChannel(userId: string, targetUserId: string): Promise<Channel> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Create the Channel
        const channel = await tx.channel.create({
          data: {
            name: `DM-${userId}-${targetUserId}`, // Internal name
            type: "DIRECT",
            authorId: userId,
          },
        });

        // 2. Add members (user and targetUser as members)
        await tx.channelMember.createMany({
          data: [
            { channelId: channel.id, role: "MEMBER", userId },
            { channelId: channel.id, role: "MEMBER", userId: targetUserId },
          ],
        });

        return channel;
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create direct channel");
    }
  }

  public async createGroupChannel(userId: string, name: string, memberIds: string[]): Promise<Channel> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Create the Channel
        const channel = await tx.channel.create({
          data: {
            name,
            type: "GROUP",
            authorId: userId,
          },
        });

        // 2. Add members (including the creator as ADMIN)
        const membersData = [
          { channelId: channel.id, role: "ADMIN" as const, userId },
          ...memberIds.map((id) => ({
            channelId: channel.id,
            role: "MEMBER" as const,
            userId: id,
          })),
        ];

        await tx.channelMember.createMany({
          data: membersData,
        });

        return channel;
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create group channel");
    }
  }

  public async getChannels(userId: string): Promise<Channel[]> {
    try {
      return await this.db.channel.findMany({
        where: { channelMembers: { some: { userId } } },
        include: {
          channelMembers: {
            include: {
              user: {
                select: { id: true, name: true, image: true, username: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1, // Get last message for the inbox
          },
          _count: {
            select: {
              messages: {
                where: {
                  authorId: { not: userId },
                  readBy: { none: { userId } }, // Count messages where auth user have NO receipt
                },
              },
            },
          },
        },
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channels");
    }
  }
}
