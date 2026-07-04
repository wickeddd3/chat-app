import type { ExtendedError, Socket } from "socket.io";
import { verifySupabaseToken } from "@/lib/jwt";

export const socketAuthMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void): Promise<void> => {
  try {
    const authObject = socket.handshake.auth as { token?: string };
    const authHeader = authObject.token;

    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) {
      next(new Error("Missing or malformed authorization header"));
      return;
    }

    // Verify the JWT locally (signature + expiry + audience) — no network call.
    const { authId } = await verifySupabaseToken(token);

    // Attach user info to socket data
    const socketData = socket.data as Record<string, unknown>;
    socketData.authId = authId;

    next();
  } catch {
    next(new Error("Invalid or expired auth token session"));
  }
};
