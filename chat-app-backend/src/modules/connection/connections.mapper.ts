import type { Connection } from "@/prisma/client";
import type { Contact, ConnectionRequest, ConnectionUser } from "./connections.types";

/**
 * Row → DTO translation for the connection module.
 *
 * Keeps the response shape in one place instead of being re-spelled inline at
 * each query site, and keeps it out of the persistence layer.
 */

/** The connection fields every request DTO carries, regardless of direction. */
type ConnectionEnvelope = Pick<Connection, "id" | "status" | "createdAt" | "updatedAt">;

/**
 * Flattens a connection plus the *counterpart's* profile into the shape the
 * client renders: `{ id, status, …, user }`.
 *
 * Which side is the counterpart depends on the list being built — the sent list
 * shows the receiver, the received list shows the sender — so the caller passes
 * it explicitly.
 */
export function toConnectionRequest(connection: ConnectionEnvelope, user: ConnectionUser): ConnectionRequest {
  return {
    id: connection.id,
    status: connection.status,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
    user,
  };
}

/**
 * Reduces an accepted connection to just the other party's profile, carrying
 * `updatedAt` through because it is the sort key the contacts cursor seeks on.
 */
export function toContact(
  row: { senderId: string; updatedAt: Date; sender: ConnectionUser; receiver: ConnectionUser },
  authUserId: string,
): Contact {
  const counterpart = row.senderId === authUserId ? row.receiver : row.sender;

  return { ...counterpart, updatedAt: row.updatedAt };
}
