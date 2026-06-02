import { Request, Response, NextFunction } from "express";
import { auth } from "@/lib/better-auth"; // Your better-auth server instance
import { fromNodeHeaders } from "better-auth/node";
import { HttpException } from "@/utils/http.exception";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Better-Auth checks the session via headers/cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      next(new HttpException(401, "Unauthorized: Please log in."));
      return;
    }

    // Attach the user to the request object for use in controllers
    req.user = session.user;
    req.session = session.session;

    next();
  } catch {
    next(new HttpException(401, "Authentication failed"));
  }
};
