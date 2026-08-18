import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient, Prisma } from "@/prisma/client";
import type { ChannelType } from "@/prisma/enums";
import type { ChannelFilter, InboxChannel, PaginatedChannels } from "../channels.types";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import { buildKeysetPage, keysetFilter, keysetTake } from "@/shared/persistence/keyset-pagination";
import { USER_PROFILE_SELECT } from "@/shared/persistence/selectors";

/** The relations the inbox list and detail views render (members, last message, unread count). */
const INBOX_INCLUDE = {
  channelMembers: { include: { user: { select: USER_PROFILE_SELECT } } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1 },
} as const;

/**
 * Unread = messages authored by someone else that this user has no receipt for.
 * System lines never count: they are narration, not correspondence, so a member
 * leaving must not light up everyone's badge.
 */
function unreadMessagesWhere(authUserId: string) {
  return {
    type: "USER" as const,
    authorId: { not: authUserId },
    readBy: { none: { userId: authUserId } },
  };
}

function unreadCountSelect(authUserId: string) {
  return {
    _count: {
      select: { messages: { where: unreadMessagesWhere(authUserId) } },
    },
  } as const;
}

/**
 * Read side of the channel module: the inbox list, single-channel detail, and
 * the unread badge count. Every method here is a projection for a view — no
 * mutations, no authorization.
 */
@injectable()
export class ChannelsQuery {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  /**
   * Filter-and-search predicate for the inbox, shared by the page query and the
   * total count so the badge always matches the list. The keyset cursor is
   * layered on separately (only the page query paginates).
   */
  private buildInboxWhere(authUserId: string, query: string, filter: ChannelFilter): Prisma.ChannelWhereInput {
    return {
      channelMembers: { some: { userId: authUserId } },
      AND: [
        {
          OR: [
            // Groups are always visible; searched by channel name.
            { type: "GROUP", name: { contains: query, mode: "insensitive" } },
            {
              // Direct channels appear only once they have messages; searched by
              // the *other* member's name.
              AND: [
                { type: "DIRECT" },
                {
                  messages: { some: {} },
                  channelMembers: {
                    some: { userId: { not: authUserId }, user: { name: { contains: query, mode: "insensitive" } } },
                  },
                },
              ],
            },
          ],
        },
        // Tab filters narrow the base set.
        ...(filter === "groups" ? [{ type: "GROUP" as const }] : []),
        ...(filter === "unread" ? [{ messages: { some: unreadMessagesWhere(authUserId) } }] : []),
      ],
    };
  }

  public async getChannels({
    authUserId,
    limit = 20,
    cursor = "",
    query = "",
    filter = "all",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
    filter?: ChannelFilter;
  }): Promise<PaginatedChannels> {
    return withPersistence("Failed to retrieve channels.", async () => {
      const baseWhere = this.buildInboxWhere(authUserId, query, filter);
      const baseAnd = baseWhere.AND as Prisma.ChannelWhereInput[];

      const [rows, total] = await Promise.all([
        this.db.channel.findMany({
          where: {
            ...baseWhere,
            AND: [...baseAnd, ...keysetFilter<Prisma.ChannelWhereInput>("updatedAt", cursor)],
          },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: keysetTake(limit),
          include: { ...INBOX_INCLUDE, ...unreadCountSelect(authUserId) },
        }),
        this.db.channel.count({ where: baseWhere }),
      ]);

      const page = buildKeysetPage({
        rows,
        limit,
        timestampOf: (row) => row.updatedAt,
        idOf: (row) => row.id,
        map: (row) => row,
      });

      return { channels: page.items, hasMore: page.hasMore, nextCursor: page.nextCursor, total };
    });
  }

  public async getChannel(userId: string, channelId: string): Promise<InboxChannel | null> {
    return withPersistence("Failed to retrieve channel.", () =>
      this.db.channel.findFirst({
        where: { id: channelId, channelMembers: { some: { userId } } },
        include: { ...INBOX_INCLUDE, ...unreadCountSelect(userId) },
      }),
    );
  }

  /**
   * The channel's identity without any of the inbox relations — enough for a
   * policy check that only asks "does it exist, and is it a group?". Deliberately
   * not `getChannel`, which loads members, the last message and an unread count
   * that a membership decision has no use for.
   */
  public async getChannelSummary(channelId: string): Promise<{ id: string; type: ChannelType } | null> {
    return withPersistence("Failed to retrieve the channel.", () =>
      this.db.channel.findUnique({ where: { id: channelId }, select: { id: true, type: true } }),
    );
  }

  /**
   * The id of the other member of a DIRECT channel, or null for a GROUP (and for
   * a channel that doesn't exist or that `userId` isn't in).
   *
   * A narrow projection on purpose: the "may these two still message?" check runs
   * on every send, and pulling the full inbox `include` for it would be wasteful.
   */
  public async getDirectCounterpartId(channelId: string, userId: string): Promise<string | null> {
    return withPersistence("Failed to resolve the direct channel counterpart.", async () => {
      const channel = await this.db.channel.findFirst({
        where: { id: channelId, type: "DIRECT", channelMembers: { some: { userId } } },
        select: { channelMembers: { where: { userId: { not: userId } }, select: { userId: true }, take: 1 } },
      });

      return channel?.channelMembers[0]?.userId ?? null;
    });
  }

  /** Total unread messages across all of the user's channels, for the global badge. */
  public async getUnreadMessagesCount({ authUserId }: { authUserId: string }): Promise<number> {
    return withPersistence("Failed to retrieve unread messages count.", async () => {
      const channels = await this.db.channel.findMany({
        where: {
          channelMembers: { some: { userId: authUserId } },
          OR: [
            { type: "GROUP" },
            {
              AND: [
                { type: "DIRECT" },
                { messages: { some: {} }, channelMembers: { some: { userId: { not: authUserId } } } },
              ],
            },
          ],
        },
        include: unreadCountSelect(authUserId),
      });

      return channels.reduce((total, channel) => total + channel._count.messages, 0);
    });
  }
}
