import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/prisma/enums";
import { SEED_NOW, MINUTE } from "../helpers/time.helper";
import { randomInt, uuid } from "../helpers/content.helper";
import type { SeededUser } from "../types";
import type { SeededConnections } from "./connections.seeder";

interface NotificationRow {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  referenceId: string;
  createdAt: Date;
}

/** Returns a timestamp a random number of minutes (within `maxDays`) before "now". */
function recently(maxDays: number): Date {
  return new Date(SEED_NOW - randomInt(1, maxDays * 24 * 60) * MINUTE);
}

/**
 * Seeds the primary account's notification feed at volume so it paginates
 * (>100 rows): one unread CONNECTION_REQUEST per received pending request, plus
 * a handful of read CONNECTION_ACCEPTED entries for already-accepted contacts.
 */
export async function seedNotifications(primary: SeededUser, connections: SeededConnections): Promise<void> {
  const rows: NotificationRow[] = [];

  // Unread "wants to connect" notifications — one per received pending request.
  for (const { connectionId, sender } of connections.receivedRequests) {
    rows.push({
      id: uuid(),
      userId: primary.id,
      type: "CONNECTION_REQUEST",
      title: "New Connection Request",
      content: `${sender.name} wants to connect with you.`,
      isRead: false,
      referenceId: connectionId,
      createdAt: recently(5),
    });
  }

  // A few read "accepted your request" notifications for historical variety.
  for (const contact of connections.acceptedContacts.slice(0, 6)) {
    rows.push({
      id: uuid(),
      userId: primary.id,
      type: "CONNECTION_ACCEPTED",
      title: "Connection Accepted",
      content: `${contact.name} accepted your connection request.`,
      isRead: true,
      referenceId: uuid(),
      createdAt: recently(30),
    });
  }

  await prisma.notification.createMany({ data: rows });
  const unread = rows.filter((r) => !r.isRead).length;
  console.log(`🔔 Notifications: ${String(rows.length)} total (${String(unread)} unread).`);
}
