import "dotenv/config";
import { Client } from "pg";
import { execSync } from "child_process";

/**
 * Jest globalSetup for the integration suite. Runs once before any test:
 *   1. Ensures the test database exists (creating it via the maintenance DB).
 *   2. Applies Prisma migrations to it, so tests run against the real schema.
 *
 * The database is chosen via TEST_DATABASE_URL and defaults to a `chat_app_test`
 * database on the local Postgres used for development (a separate DB, so dev data
 * is never touched).
 */
export default async function globalSetup(): Promise<void> {
  // 5435 is the host port the compose stack publishes Postgres on (5432 is taken
  // by another local project) — see docker-compose.yml.
  const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql://root:root@localhost:5435/chat_app_test";

  const url = new URL(testDatabaseUrl);
  const dbName = url.pathname.replace(/^\//, "");

  // Connect to the maintenance database to create the test DB if it's missing.
  const adminUrl = new URL(testDatabaseUrl);
  adminUrl.pathname = "/postgres";

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (rowCount === 0) {
      // Identifier can't be parameterized; dbName comes from our own config.
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`\n[integration] created test database "${dbName}"`);
    }
  } finally {
    await admin.end();
  }

  // Apply migrations to the test DB (idempotent — no-ops if already up to date).
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  });
}
