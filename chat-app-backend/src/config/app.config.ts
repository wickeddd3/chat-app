export const APP_URL = process.env.APP_URL ?? "";

export const API_URL = process.env.API_URL ?? "";

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

export const DATABASE_URL = process.env.DATABASE_URL;

export const REDIS_URL = process.env.REDIS_URL;

export const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
