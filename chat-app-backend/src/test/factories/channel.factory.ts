import { randomUUID } from "crypto";
import type { Channel, ChannelMember, Message, MessageReceipt } from "@/prisma/client";
import type { ChannelRole, ChannelType } from "@/prisma/enums";
import { prisma } from "@/test/helpers/db.helper";

export interface ChannelOverrides {
  authorId: string;
  name?: string;
  type?: ChannelType;
  createdAt?: Date;
}

/** Inserts a Channel row (defaults to a GROUP authored by `authorId`). */
export async function createChannel(overrides: ChannelOverrides): Promise<Channel> {
  return prisma.channel.create({
    data: {
      name: overrides.name ?? `channel-${randomUUID().slice(0, 8)}`,
      type: overrides.type ?? "GROUP",
      authorId: overrides.authorId,
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
    },
  });
}

/** Adds a user to a channel (defaults to MEMBER). */
export async function addMember(
  channelId: string,
  userId: string,
  role: ChannelRole = "MEMBER",
): Promise<ChannelMember> {
  return prisma.channelMember.create({ data: { channelId, userId, role } });
}

/**
 * Creates a DIRECT channel between two users, with both as members — mirroring
 * what ConnectionsRepository/ChannelsRepository do, for arranging test state.
 */
export async function createDirectChannel(userAId: string, userBId: string): Promise<Channel> {
  const channel = await createChannel({ authorId: userAId, type: "DIRECT", name: `DM-${userAId}-${userBId}` });
  await addMember(channel.id, userAId);
  await addMember(channel.id, userBId);
  return channel;
}

export interface MessageOverrides {
  channelId: string;
  authorId: string;
  content?: string;
  createdAt?: Date;
  /** Makes the row a reply quoting the given message. */
  parentId?: string;
}

/** Inserts a Message row. */
export async function createMessage(overrides: MessageOverrides): Promise<Message> {
  return prisma.message.create({
    data: {
      content: overrides.content ?? `message-${randomUUID().slice(0, 8)}`,
      channelId: overrides.channelId,
      authorId: overrides.authorId,
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
      ...(overrides.parentId && { parentId: overrides.parentId }),
    },
  });
}

/** Marks a message read by a user (creates a receipt). */
export async function createReceipt(messageId: string, userId: string): Promise<MessageReceipt> {
  return prisma.messageReceipt.create({ data: { messageId, userId } });
}
