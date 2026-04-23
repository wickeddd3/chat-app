export const LOCAL_APP = `http://localhost:${process.env.PORT}`;

export const PRODUCTION_APP = `${process.env.APP_URL}`;

export const ALLOWED_ORIGINS =
  process.env.NODE_ENV === "production"
    ? [PRODUCTION_APP]
    : [LOCAL_APP, PRODUCTION_APP];
