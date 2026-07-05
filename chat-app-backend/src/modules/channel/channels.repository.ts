import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient } from "@/prisma/client";
import type { Channel } from "@/prisma/client";
import type { InboxChannel, PaginatedChannels } from "./channels.types";
import { HttpException } from "@/utils/http.exception";
import { decodeCursor, encodeCursor } from "@/utils/cursor";

@injectable()
export class ChannelsRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async getUnreadMessagesCount({ authUserId }: { authUserId: string }): Promise<number> {
    try {
      const channels = await this.db.channel.findMany({
        where: {
          channelMembers: { some: { userId: authUserId } },
          OR: [
            {
              type: "GROUP",
            },
            {
              AND: [
                { type: "DIRECT" },
                {
                  messages: { some: {} },
                  channelMembers: {
                    some: {
                      userId: { not: authUserId }, // Exclude current user from name matching
                    },
                  },
                }, // DMs only visible if messages exist
              ],
            },
          ],
        },
        include: {
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

      const unreadCount = channels.reduce((total, channel) => total + channel._count.messages, 0);

      return unreadCount;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve unread messages count.", null, { cause: error });
    }
  }

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
      const decoded = decodeCursor(cursor);
      const channels = await this.db.channel.findMany({
        // Fetch one extra to reliably determine hasMore.
        take: limit + 1,
        where: {
          channelMembers: { some: { userId: authUserId } },
          // The search filter and the keyset cursor are separate OR-groups, so
          // they must be combined under AND (a single object can hold one OR).
          AND: [
            {
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
            },
            // Keyset cursor: (updatedAt, id) strictly before the boundary.
            ...(decoded
              ? [
                  {
                    OR: [
                      { updatedAt: { lt: decoded.timestamp } },
                      { updatedAt: decoded.timestamp, id: { lt: decoded.id } },
                    ],
                  },
                ]
              : []),
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
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

      const hasMore = channels.length > limit;
      const pageItems = hasMore ? channels.slice(0, limit) : channels;
      const lastItem = pageItems.at(-1);
      const nextCursor = hasMore && lastItem ? encodeCursor(lastItem.updatedAt, lastItem.id) : null;

      return {
        channels: pageItems,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve channels.", null, { cause: error });
    }
  }

  public async getChannel(userId: string, channelId: string): Promise<InboxChannel | null> {
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
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve channel.", null, { cause: error });
    }
  }

  public async getRawMemberIds(userId: string, channelId: string): Promise<string[]> {
    try {
      const channel = await this.db.channel.findFirst({
        where: {
          id: channelId,
          channelMembers: { some: { userId: userId } },
        },
        include: {
          channelMembers: {
            include: {
              user: {
                select: { id: true },
              },
            },
          },
        },
      });

      const channelMembers: string[] = channel?.channelMembers.map((member) => member.user.id) ?? [];

      return channelMembers;
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve channel member ids.", null, { cause: error });
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
    } catch (error) {
      throw new HttpException(500, "Failed to find direct channel.", null, { cause: error });
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
    } catch (error) {
      throw new HttpException(500, "Failed to create direct channel.", null, { cause: error });
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
    } catch (error) {
      throw new HttpException(500, "Failed to create group channel.", null, { cause: error });
    }
  }

  public async updateGroupChannel(
    userId: string,
    channelId: string,
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
    } catch (error) {
      throw new HttpException(500, "Failed to update group channel.", null, { cause: error });
    }
  }

  public async updateChannel(channelId: string): Promise<Channel> {
    try {
      return await this.db.channel.update({
        where: { id: channelId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      throw new HttpException(500, "Failed to update channel.", null, { cause: error });
    }
  }
}
