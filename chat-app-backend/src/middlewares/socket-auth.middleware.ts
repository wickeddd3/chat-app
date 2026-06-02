import type { ExtendedError, Socket } from "socket.io";
import { auth } from "@/lib/better-auth";
import { fromNodeHeaders } from "better-auth/node";
import type { User } from "better-auth";

export const socketAuthMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    // Better-Auth checks the session via headers/cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(socket.handshake.headers),
    });

    if (!session) {
      next(new Error("Unauthorized: Please log in."));
      return;
    }

    // Attach user info to socket data
    const socketData = socket.data as { user: User };
    socketData.user = session.user;

    next();
  } catch {
    next(new Error("Authentication failed"));
  }
};
