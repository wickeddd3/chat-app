import type { ExtendedError, Socket } from "socket.io";
import { supabase } from "@/lib/supabase";

export const socketAuthMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    const authObject = socket.handshake.auth as { token?: string };
    const authHeader = authObject.token;

    if (!authHeader?.startsWith("Bearer ")) {
      next(new Error("Missing or malformed authorization header"));
    }

    const token = authHeader?.split(" ")[1];

    // Authenticate the token against Supabase infrastructure directly
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      next(new Error("Invalid or expired auth token session"));
      return;
    }

    // Attach user info to socket data
    const socketData = socket.data as Record<string, unknown>;
    socketData.authId = user.id;

    next();
  } catch {
    next(new Error("Authentication failed"));
  }
};
