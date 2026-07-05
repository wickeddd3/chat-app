import { prisma } from "@/lib/prisma";
import type { ConnectionStatus } from "@/prisma/enums";
import { SEED_CONFIG } from "../config";
import { daysAgo } from "../helpers/time.helper";
import { randomInt, uuid } from "../helpers/content.helper";
import type { SeededUser } from "../types";

interface ConnectionRow {
  id: string;
  senderId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: Date;
}

/** What the connections seeder hands to the channel/notification seeders. */
export interface SeededConnections {
  /** Accepted contacts of the primary account — each becomes a DM channel. */
  acceptedContacts: SeededUser[];
  /** Pending requests the primary RECEIVED — each becomes a notification. */
  receivedRequests: { connectionId: string; sender: SeededUser }[];
}

/** Builds an accepted connection row, alternating direction so contacts appear on both sides. */
function acceptedRow(primary: SeededUser, contact: SeededUser, primaryIsSender: boolean): ConnectionRow {
  const [senderId, receiverId] = primaryIsSender ? [primary.id, contact.id] : [contact.id, primary.id];
  return { id: uuid(), senderId, receiverId, status: "ACCEPTED", createdAt: daysAgo(randomInt(5, 60)) };
}

/**
 * Seeds the primary account's connection graph at volume so every connection-
 * backed list paginates (>100 rows each). `people` is the bucket-ordered account
 * list from the users seeder: [primary, ...contacts, ...receivers, ...targets],
 * which this slices with the configured sizes.
 */
export async function seedConnections(primary: SeededUser, people: SeededUser[]): Promise<SeededConnections> {
  const { contacts, receivedRequests, sentRequests } = SEED_CONFIG;

  let offset = 1; // index 0 is the primary account
  const take = (n: number): SeededUser[] => people.slice(offset, (offset += n));
  const contactUsers = take(contacts);
  const receivedUsers = take(receivedRequests);
  const sentUsers = take(sentRequests);

  const rows: ConnectionRow[] = [];
  const received: SeededConnections["receivedRequests"] = [];

  // Accepted contacts (mixed direction).
  contactUsers.forEach((contact, i) => rows.push(acceptedRow(primary, contact, i % 2 === 0)));

  // Pending requests received by the primary account.
  for (const sender of receivedUsers) {
    const id = uuid();
    rows.push({
      id,
      senderId: sender.id,
      receiverId: primary.id,
      status: "PENDING",
      createdAt: daysAgo(randomInt(1, 5)),
    });
    received.push({ connectionId: id, sender });
  }

  // Pending requests sent by the primary account.
  for (const receiver of sentUsers) {
    rows.push({
      id: uuid(),
      senderId: primary.id,
      receiverId: receiver.id,
      status: "PENDING",
      createdAt: daysAgo(randomInt(1, 5)),
    });
  }

  await prisma.connection.createMany({ data: rows });
  console.log(
    `🔗 Connections: ${String(contactUsers.length)} accepted, ${String(received.length)} received, ${String(sentUsers.length)} sent.`,
  );

  return { acceptedContacts: contactUsers, receivedRequests: received };
}
