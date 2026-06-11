export {};

declare global {
  namespace Express {
    interface Request {
      authId?: string;
    }
  }
}
