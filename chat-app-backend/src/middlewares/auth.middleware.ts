import { Request, Response, NextFunction } from "express";
import { HttpException } from "@/utils/http.exception";
import { supabase } from "@/lib/supabase";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.split(" ")[1];

    // Authenticate the token against Supabase infrastructure directly
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      next(new HttpException(401, "Invalid or expired auth token session"));
      return;
    }

    req.authId = user.id;
    next();
  } catch {
    next(new HttpException(401, "Authentication failed"));
  }
};
