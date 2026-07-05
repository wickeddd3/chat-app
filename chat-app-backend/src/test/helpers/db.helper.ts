import { prisma } from "@/lib/prisma";

// Child tables first isn't required with CASCADE, but listing every table keeps
// the reset explicit and fast (one statement, RESTART IDENTITY for a clean slate).
const TABLES = [
  "message_receipts",
  "messages",
  "channel_members",
  "channels",
  "notifications",
  "connections",
  "users",
] as const;

/** The real PrismaClient, connected to the test database (see integration.setup.ts). */
export { prisma };

/** Empties every seeder/app table so each integration test starts from a clean slate. */
export async function truncateAll(): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

/** Closes the DB connection (call once after the suite). */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
