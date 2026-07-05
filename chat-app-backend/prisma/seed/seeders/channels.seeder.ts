import { prisma } from "@/lib/prisma";
import type { ChannelRole, ChannelType } from "@/prisma/enums";
import { SEED_CONFIG } from "../config";
import { daysAgo, addMinutes, MINUTE } from "../helpers/time.helper";
import { pick, randomInt, randomMessage, uuid } from "../helpers/content.helper";
import type { SeededUser } from "../types";

interface ChannelRow {
  id: string;
  name: string;
  type: ChannelType;
  authorId: string;
  createdAt: Date;
}
interface MemberRow {
  id: string;
  channelId: string;
  userId: string;
  role: ChannelRole;
  joinedAt: Date;
}
interface MessageRow {
  id: string;
  content: string;
  channelId: string;
  authorId: string;
  createdAt: Date;
}
interface ReceiptRow {
  messageId: string;
  userId: string;
  readAt: Date;
}

/** Mutable accumulators; every channel appends here, then each table is bulk-inserted once. */
interface Accumulator {
  channels: ChannelRow[];
  members: MemberRow[];
  messages: MessageRow[];
  receipts: ReceiptRow[];
}

/**
 * Builds one channel (+ members, a message backlog, and read receipts) into the
 * shared accumulators. `lastAuthorId` pins the most recent sender so unread
 * badges land predictably; the final `unreadTail` messages are left unread.
 */
function buildChannel(
  acc: Accumulator,
  opts: {
    name: string;
    type: ChannelType;
    members: SeededUser[];
    messageCount: number;
    startDaysAgo: number;
    lastAuthorId: string;
    unreadTail: number;
  },
): void {
  const { name, type, members, messageCount, startDaysAgo, lastAuthorId, unreadTail } = opts;
  const creator = members[0];
  if (!creator) return;

  const channelId = uuid();
  const createdAt = daysAgo(startDaysAgo);
  acc.channels.push({ id: channelId, name, type, authorId: creator.id, createdAt });

  members.forEach((m, i) => {
    acc.members.push({
      id: uuid(),
      channelId,
      userId: m.id,
      role: type === "GROUP" && i === 0 ? "ADMIN" : "MEMBER",
      joinedAt: createdAt,
    });
  });

  const built: MessageRow[] = [];
  let cursor = createdAt.getTime();
  for (let i = 0; i < messageCount; i++) {
    cursor = addMinutes(cursor, randomInt(5, 180));
    const isLast = i === messageCount - 1;
    const author = (isLast ? members.find((m) => m.id === lastAuthorId) : undefined) ?? pick(members);
    const row: MessageRow = {
      id: uuid(),
      content: randomMessage(),
      channelId,
      authorId: author.id,
      createdAt: new Date(cursor),
    };
    built.push(row);
    acc.messages.push(row);
  }

  // Everyone except the author has "read" all but the last `unreadTail` messages.
  for (const msg of built.slice(0, Math.max(0, built.length - unreadTail))) {
    for (const m of members) {
      if (m.id === msg.authorId) continue;
      acc.receipts.push({
        messageId: msg.id,
        userId: m.id,
        readAt: new Date(msg.createdAt.getTime() + randomInt(1, 120) * MINUTE),
      });
    }
  }
}

/**
 * Seeds the primary account's inbox: a DIRECT channel with every accepted
 * contact (so the channel list paginates past 100), one large "showcase" group
 * with a >100-message backlog for scroll pagination, plus a couple of smaller
 * groups for variety. All rows are bulk-inserted per table for speed.
 */
export async function seedChannels(primary: SeededUser, acceptedContacts: SeededUser[]): Promise<void> {
  const { directMessages, showcaseMessages, unreadTail } = SEED_CONFIG;
  const acc: Accumulator = { channels: [], members: [], messages: [], receipts: [] };

  // One DM per accepted contact — the other person sends last so the primary
  // account has unread badges to see.
  for (const contact of acceptedContacts) {
    buildChannel(acc, {
      name: `DM-${primary.id}-${contact.id}`,
      type: "DIRECT",
      members: [primary, contact],
      messageCount: randomInt(directMessages.min, directMessages.max),
      startDaysAgo: randomInt(1, 50),
      lastAuthorId: contact.id,
      unreadTail,
    });
  }

  // Large showcase group for message-pagination testing.
  const groupMembers = [primary, ...acceptedContacts.slice(0, 5)];
  const showcaseLast = groupMembers[2] ?? groupMembers[1];
  if (showcaseLast) {
    buildChannel(acc, {
      name: "Weekend Trip 🏔️",
      type: "GROUP",
      members: groupMembers,
      messageCount: showcaseMessages,
      startDaysAgo: 30,
      lastAuthorId: showcaseLast.id,
      unreadTail: 4,
    });
  }

  // A couple of smaller groups for variety.
  const smallGroups: { name: string; slice: [number, number]; count: number }[] = [
    { name: "Design Team 🎨", slice: [1, 5], count: 40 },
    { name: "Book Club 📚", slice: [3, 8], count: 25 },
  ];
  for (const g of smallGroups) {
    const members = [primary, ...acceptedContacts.slice(g.slice[0], g.slice[1])];
    const last = members[1];
    if (members.length < 2 || !last) continue;
    buildChannel(acc, {
      name: g.name,
      type: "GROUP",
      members,
      messageCount: g.count,
      startDaysAgo: randomInt(5, 40),
      lastAuthorId: last.id,
      unreadTail,
    });
  }

  await prisma.channel.createMany({ data: acc.channels });
  await prisma.channelMember.createMany({ data: acc.members });
  await prisma.message.createMany({ data: acc.messages });
  await prisma.messageReceipt.createMany({ data: acc.receipts });

  console.log(
    `💬 Channels: ${String(acc.channels.length)} channels, ${String(acc.messages.length)} messages, ${String(acc.receipts.length)} receipts.`,
  );
}
