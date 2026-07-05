import { prisma } from "@/lib/prisma";
import { SEED_CONFIG } from "./config";
import { buildAccountSpecs } from "./accounts";
import { deleteAllProfiles, resetBusinessTables } from "./helpers/database.helper";
import { deleteAuthUsersByEmails } from "./helpers/auth.helper";

/**
 * Wipes everything the seeder creates so you can start fresh without manually
 * clearing tables or deleting Supabase Auth users: all business tables, all user
 * profiles, and every seeded Supabase Auth account (resolved from the same specs
 * the seeder builds).
 */
async function main(): Promise<void> {
  await resetBusinessTables();
  await deleteAllProfiles();

  const emails = buildAccountSpecs().map((spec) => spec.email);
  console.log(`Deleting ${String(emails.length)} seeded Supabase Auth users...`);
  await deleteAuthUsersByEmails(emails, SEED_CONFIG.authConcurrency);

  console.log("\n✅ Clean complete. Run `npm run seed` for a fresh dataset.\n");
}

main()
  .catch((err: unknown) => {
    console.error("❌ Clean failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
