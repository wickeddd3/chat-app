import { prisma } from "@/lib/prisma";
import type { Channel } from "@/prisma/client";
import type { InboxChannel } from "./channels.types";

export class ChannelsRepository {
  private db = prisma;

  public async getChannels(userId: string): Promise<InboxChannel[]> {
    try {
      return await this.db.channel.findMany({
        where: {
          channelMembers: { some: { userId } },
          OR: [
            { type: "GROUP" }, // Groups are always visible
            {
              AND: [
                { type: "DIRECT" },
                { messages: { some: {} } }, // DMs only visible if messages exist
              ],
            },
          ],
        },
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

  public async getChannel(userId: string, channelId: number): Promise<InboxChannel | null> {
    try {
      return await prisma.channel.findFirst({
        where: {
          id: channelId,
          channelMembers: { some: { userId: userId } },
        },
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
      throw new Error(error?.message || "Failed to retrieve channel");
    }
  }

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

  public async createGroupChannel(userId: string, data: { name: string; memberIds: string[] }): Promise<Channel> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Create the Channel
        const channel = await tx.channel.create({
          data: {
            name: data.name,
            type: "GROUP",
            authorId: userId,
          },
        });

        // 2. Add members (including the creator as ADMIN)
        const membersData = [
          { channelId: channel.id, role: "ADMIN" as const, userId },
          ...data.memberIds
            .filter((id) => id !== userId) // Avoid duplicate for the admin
            .map((id) => ({
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

  public async updateGroupChannel(
    userId: string,
    channelId: number,
    data: { name: string; memberIds: string[] },
  ): Promise<Channel> {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Authorization: Check if the user is an ADMIN of this channel
        const isAdmin = await tx.channelMember.findFirst({
          where: {
            channelId,
            userId,
            role: "ADMIN",
          },
        });

        if (!isAdmin) {
          throw new Error("Unauthorized: Only admins can update the group.");
        }

        // 2. Update Channel Metadata (Name)
        const updatedChannel = await tx.channel.update({
          where: { id: channelId },
          data: { name: data.name },
        });

        // 3. Sync Memberships
        // We delete existing members and re-create them based on the new list.
        // This is simpler and less error-prone than manual diffing.
        await tx.channelMember.deleteMany({
          where: { channelId },
        });

        const membersData = [
          // Ensure the creator/admin remains an ADMIN
          { channelId, role: "ADMIN" as const, userId },
          // Add everyone else as MEMBER
          ...data.memberIds
            .filter((id) => id !== userId) // Avoid duplicate for the admin
            .map((id) => ({
              channelId,
              role: "MEMBER" as const,
              userId: id,
            })),
        ];

        await tx.channelMember.createMany({
          data: membersData,
        });

        return updatedChannel;
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to update group channel");
    }
  }
}
