import { prisma } from "@/lib/prisma";
import { SEED_CONFIG, resolveAuthMode } from "./config";
import { backdateActivityTimestamps, deleteAllProfiles, resetBusinessTables } from "./helpers/database.helper";
import { seedUsers } from "./seeders/users.seeder";
import { seedConnections } from "./seeders/connections.seeder";
import { seedChannels } from "./seeders/channels.seeder";
import { seedNotifications } from "./seeders/notifications.seeder";

/**
 * Seeds a realistic chat dataset centered on a primary account:
 *   users (all Auth-backed) → connections → channels/messages → notifications.
 * Idempotent — business tables and profiles are cleared first, and Auth users are
 * reused by email. Pass --reuse-auth (npm run seed:prod) to require existing
 * Supabase Auth users instead of creating them.
 */
async function main(): Promise<void> {
  const mode = resolveAuthMode(process.argv.slice(2));

  // Clear seeder-owned data first so reseeds don't accumulate (Auth users persist).
  await resetBusinessTables();
  await deleteAllProfiles();

  const people = await seedUsers(mode);
  const primary = people[0];
  if (!primary) {
    console.error("❌ No primary account was resolved — aborting.");
    process.exitCode = 1;
    return;
  }

  console.log(`\n🌱 Seeding chat data around primary account: ${primary.email}\n`);
  const connections = await seedConnections(primary, people);
  await seedChannels(primary, connections.acceptedContacts);
  await seedNotifications(primary, connections);
  await backdateActivityTimestamps();

  console.log(`\n✅ Done. Sign in as ${primary.email} (password: ${SEED_CONFIG.password}) to explore.\n`);
}

main()
  .catch((err: unknown) => {
    console.error("❌ Seeding failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
