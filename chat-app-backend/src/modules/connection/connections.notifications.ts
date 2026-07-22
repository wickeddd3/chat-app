import type { NewNotification } from "@/modules/notification/notifications.types";
import type { ConnectionWithParties } from "./connections.types";

/**
 * Notification payloads for connection events.
 *
 * The *copy* is connection-domain knowledge, so it lives here; persisting it is
 * the notifications module's job. Previously `ConnectionsRepository` composed the
 * text and wrote the `notification` table itself, giving that table two owners.
 */

/** Alerts the addressee that someone wants to connect. */
export function connectionRequestNotification(connection: ConnectionWithParties): NewNotification {
  return {
    userId: connection.receiverId,
    type: "CONNECTION_REQUEST",
    title: "New Connection Request",
    content: `${connection.sender.name} wants to connect with you.`,
    referenceId: connection.id,
  };
}

/** Alerts the original requester that their request went through. */
export function connectionAcceptedNotification(connection: ConnectionWithParties): NewNotification {
  return {
    userId: connection.senderId,
    type: "CONNECTION_ACCEPTED",
    title: "Connection Accepted",
    content: `${connection.receiver.name} accepted your connection request.`,
    referenceId: connection.id,
  };
}
