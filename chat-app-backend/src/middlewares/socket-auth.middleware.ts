import type { ExtendedError, Socket } from "socket.io";
import { auth } from "@/lib/better-auth";
import { fromNodeHeaders } from "better-auth/node";

export const socketAuthMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    // Better-Auth checks the session via headers/cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(socket.handshake.headers),
    });

    if (!session) {
      return next(new Error("Unauthorized: Please log in."));
    }

    // Attach user info to socket data
    socket.data.user = session.user;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};
