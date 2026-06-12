import { cleanEnv, str, port } from "envalid";

export const validateEnv = (): void => {
  cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ["development", "production"],
    }),
    PORT: port({ default: 4000 }),
    DATABASE_URL: str(),
    REDIS_URL: str(),
    APP_URL: str(),
    SUPABASE_URL: str(),
    SUPABASE_SERVICE_ROLE_KEY: str(),
  });
};
