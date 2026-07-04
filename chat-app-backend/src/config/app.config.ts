import { cleanEnv, str, port } from "envalid";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

/**
 * Single source of truth for environment configuration. `cleanEnv` validates
 * and coerces `process.env` at import time and fails fast (process exit) if a
 * required variable is missing or malformed — so the rest of the app can rely
 * on these being present and correctly typed.
 *
 * Requires `dotenv` to have been loaded first (see index.ts / prisma.ts).
 */
export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  PORT: port({ default: 4000 }),
  LOG_LEVEL: str({ choices: [...LOG_LEVELS], default: "info" }),
  DATABASE_URL: str(),
  REDIS_URL: str(),
  APP_URL: str(),
  API_URL: str({ default: "" }),
  SUPABASE_URL: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
});

export const NODE_ENV = env.NODE_ENV;
export const IS_PRODUCTION = env.isProduction;
export const IS_TEST = env.isTest;

export const PORT = env.PORT;
export const LOG_LEVEL = env.LOG_LEVEL;
export const DATABASE_URL = env.DATABASE_URL;
export const REDIS_URL = env.REDIS_URL;

export const APP_URL = env.APP_URL;
export const API_URL = env.API_URL;

export const SUPABASE_URL = env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
