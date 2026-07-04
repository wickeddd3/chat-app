import { Request, Response, NextFunction } from "express";
import { HttpException } from "@/utils/http.exception";
import { verifySupabaseToken } from "@/lib/jwt";

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      next(new HttpException(401, "Missing or malformed authorization header"));
      return;
    }

    // Verify the JWT locally (signature + expiry + audience) — no network call.
    const { authId } = await verifySupabaseToken(token);

    req.authId = authId;
    next();
  } catch {
    next(new HttpException(401, "Invalid or expired auth token session"));
  }
};
