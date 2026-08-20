import "reflect-metadata";

// Integration tests run against a REAL Postgres test database. Point DATABASE_URL
// at it *before* any module (app.config → @/lib/prisma) reads env at import time.
// This is force-set (not `??=`) so it wins over a dev value; `@/lib/prisma`'s
// `dotenv/config` won't override an already-set var.
// 5435 is the host port the compose stack publishes Postgres on — see
// docker-compose.yml, which remaps it to keep 5432 free for another project.
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://root:root@localhost:5435/chat_app_test";
process.env.DATABASE_URL = TEST_DATABASE_URL;

process.env.NODE_ENV = "test";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.APP_URL ??= "http://localhost:5173";
process.env.SUPABASE_URL ??= "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.LOG_LEVEL ??= "silent";
