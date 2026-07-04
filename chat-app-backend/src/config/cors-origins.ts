import { APP_URL, IS_PRODUCTION, PORT } from "@/config/app.config";

export const LOCAL_APP = `http://localhost:${String(PORT)}`;

export const PRODUCTION_APP = APP_URL;

export const ALLOWED_ORIGINS = IS_PRODUCTION ? [PRODUCTION_APP] : [LOCAL_APP, PRODUCTION_APP];
