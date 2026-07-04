import "reflect-metadata";

// Provide dummy values for the variables `app.config`'s cleanEnv requires, so
// importing any module that transitively loads config doesn't fail-fast in
// tests. Individual tests mock infra (prisma/redis) rather than connect.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.APP_URL ??= "http://localhost:5173";
process.env.SUPABASE_URL ??= "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.LOG_LEVEL ??= "silent";
