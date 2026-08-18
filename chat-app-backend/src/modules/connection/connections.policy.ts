import type { Connection } from "@/prisma/client";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors/domain.error";

/**
 * Connection-request authorization and state-transition rules.
 *
 * Pure functions over already-loaded rows — no Prisma, no I/O — so every branch
 * is unit-testable without a database. These previously lived inside the
 * repository (and, for accept, inside the transaction), which is why a "you can't
 * decline someone else's request" failure reached the client as a 500.
 */

/** A connection request cannot be sent to yourself. */
export function assertNotSelfConnection(senderId: string, receiverId: string): void {
  if (senderId === receiverId) {
    throw new ValidationError("You cannot send a connection request to yourself.");
  }
}

/** Only one connection may exist per pair, in either direction. */
export function assertNoExistingConnection(existing: Connection | null): void {
  if (existing) {
    throw new ConflictError("A connection with this user already exists.");
  }
}

/** Accepting requires the caller to be the addressee of the request. */
export function assertCanAccept(connection: Connection | null, receiverId: string): asserts connection is Connection {
  if (!connection) {
    throw new NotFoundError("Connection request not found.");
  }
  if (connection.receiverId !== receiverId) {
    throw new ForbiddenError("You cannot accept a request addressed to someone else.");
  }
}

/** Declining is the addressee's action, and only while the request is pending. */
export function assertCanDecline(connection: Connection | null, receiverId: string): asserts connection is Connection {
  if (!connection) {
    throw new NotFoundError("Connection request not found.");
  }
  if (connection.receiverId !== receiverId) {
    throw new ForbiddenError("You cannot decline a request addressed to someone else.");
  }
  if (connection.status !== "PENDING") {
    throw new ConflictError(`Cannot decline a request with status: ${connection.status}.`);
  }
}

/**
 * Removing a contact dissolves an *accepted* connection, and either party may do
 * it. A pending request is withdrawn by cancelling or declining instead, so those
 * states are rejected here rather than silently deleting the request.
 */
export function assertCanRemoveContact(
  connection: Connection | null,
  authUserId: string,
): asserts connection is Connection {
  if (!connection) {
    throw new NotFoundError("You are not connected to this user.");
  }
  if (connection.senderId !== authUserId && connection.receiverId !== authUserId) {
    throw new ForbiddenError("You cannot remove a connection you are not part of.");
  }
  if (connection.status !== "ACCEPTED") {
    throw new ConflictError("This user is not one of your contacts.");
  }
}

/**
 * Cancelling is the author's action, and only while the request is pending —
 * once accepted, the relationship is dissolved by disconnecting, not cancelling.
 */
export function assertCanCancel(connection: Connection | null, senderId: string): asserts connection is Connection {
  if (!connection) {
    throw new NotFoundError("Connection request not found.");
  }
  if (connection.senderId !== senderId) {
    throw new ForbiddenError("You cannot cancel a request sent by someone else.");
  }
  if (connection.status !== "PENDING") {
    throw new ConflictError("Cannot cancel a request that has already been accepted or handled.");
  }
}
