import { prisma } from "@/lib/prisma";

/**
 * Deletes every row from the tables this seeder owns, in FK-safe order. User
 * profiles are preserved (they are tied to Supabase Auth and handled separately).
 */
export async function resetBusinessTables(): Promise<void> {
  await prisma.messageReceipt.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.connection.deleteMany();
  console.log("🧹 Cleared connections, channels, members, messages, receipts, notifications.");
}

/**
 * Deletes every user profile row. Auth users are untouched here (they are reused
 * by email on reseed). Must run after resetBusinessTables() so nothing references
 * these profiles.
 */
export async function deleteAllProfiles(): Promise<void> {
  const { count } = await prisma.user.deleteMany();
  console.log(`🧹 Removed ${String(count)} user profiles.`);
}

/**
 * Backdates the @updatedAt columns Prisma forces to now() on write, so the inbox
 * (channels by activity) and contacts (connections by recency) sort realistically:
 * each channel adopts its latest message time, each connection its createdAt.
 */
export async function backdateActivityTimestamps(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    UPDATE channels c
    SET "updatedAt" = sub.max_created
    FROM (SELECT "channelId", MAX("createdAt") AS max_created FROM messages GROUP BY "channelId") sub
    WHERE c.id = sub."channelId";
  `);
  await prisma.$executeRawUnsafe(`UPDATE connections SET "updatedAt" = "createdAt";`);
  console.log("🕒 Backdated channel/connection timestamps to reflect activity.");
}
