import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { Channel } from "@/prisma/client";
import type { InboxChannel, PaginatedChannels } from "./channels.types";

@injectable()
export class ChannelsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async getChannels({
    authUserId,
    limit = 20,
    cursor,
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
  }): Promise<PaginatedChannels> {
    try {
      const channels = await this.db.channel.findMany({
        take: limit,
        where: {
          channelMembers: { some: { userId: authUserId } },
          OR: [
            {
              type: "GROUP", // If it's a group channel, search by the channel name
              name: {
                contains: query,
                mode: "insensitive",
              },
            }, // Groups are always visible
            {
              AND: [
                { type: "DIRECT" },
                {
                  messages: { some: {} }, // If it's a direct message, search by the names of the OTHER members in that channel
                  channelMembers: {
                    some: {
                      userId: { not: authUserId }, // Exclude current user from name matching
                      user: {
                        name: {
                          contains: query,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                }, // DMs only visible if messages exist
              ],
            },
          ],
          ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
        },
        orderBy: { updatedAt: "desc" },
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
                  authorId: { not: authUserId },
                  readBy: { none: { userId: authUserId } }, // Count messages where auth user have NO receipt
                },
              },
            },
          },
        },
      });

      const hasMore = channels.length === limit;
      const nextCursor = hasMore ? channels[channels.length - 1]?.updatedAt?.toISOString() : null;

      return {
        channels,
        hasMore,
        nextCursor: nextCursor || null,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve channels");
    }
  }

  public async getChannel(userId: string, channelId: number): Promise<InboxChannel | null> {
    try {
      return await this.db.channel.findFirst({
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
      const existing = await this.db.channel.findFirst({
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
      return await this.db.$transaction(async (tx) => {
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
      return await this.db.$transaction(async (tx) => {
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
      return await this.db.$transaction(async (tx) => {
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

  public async updateChannel(channelId: number): Promise<Channel> {
    try {
      return await this.db.channel.update({
        where: { id: channelId },
        data: { updatedAt: new Date() },
      });
    } catch (error: any) {
      throw new Error(error?.message || "Failed to update channel");
    }
  }
}
