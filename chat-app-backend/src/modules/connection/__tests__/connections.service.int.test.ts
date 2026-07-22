import type { EventEmitter } from "events";
import { ConnectionsService } from "@/modules/connection/connections.service";
import { ConnectionsQuery } from "@/modules/connection/persistence/connections.query";
import { ConnectionsRepository } from "@/modules/connection/persistence/connections.repository";
import { NotificationsRepository } from "@/modules/notification/notifications.repository";
import { TransactionManager } from "@/shared/persistence/transaction";
import type { PresenceService } from "@/services/presence.service";
import { prisma } from "@/test/helpers/db.helper";
import { createConnection, createUser } from "@/test/factories";

// The service is the unit under test: policy, the cross-module transaction
// (connection + notification) and event emission all live in it now. Its
// persistence collaborators are the real ones, against the real test database.
const query = new ConnectionsQuery(prisma);
const repository = new ConnectionsRepository(prisma);
const notifications = new NotificationsRepository(prisma);
const transactions = new TransactionManager(prisma);

const dispatcher = { emit: jest.fn() };
const presence = { setPresenceLookup: jest.fn().mockResolvedValue(undefined) };

const service = new ConnectionsService(
  query,
  repository,
  notifications,
  transactions,
  dispatcher as unknown as EventEmitter,
  presence as unknown as PresenceService,
);

beforeEach(() => {
  dispatcher.emit.mockClear();
  presence.setPresenceLookup.mockClear();
});

/** Reads the payload of the first emission of `event`. */
function emittedPayload(event: string): unknown {
  return dispatcher.emit.mock.calls.find(([name]) => name === event)?.[1];
}

describe("ConnectionsService (integration, real DB)", () => {
  describe("sendRequest", () => {
    it("atomically creates a PENDING connection and a notification for the receiver", async () => {
      const [sender, receiver] = [await createUser({ name: "Sender" }), await createUser()];

      const result = await service.sendRequest(sender.id, receiver.id);

      expect(result.sentConnection.status).toBe("PENDING");
      const connections = await prisma.connection.findMany();
      expect(connections).toHaveLength(1);
      expect(connections[0]).toMatchObject({ senderId: sender.id, receiverId: receiver.id, status: "PENDING" });

      const stored = await prisma.notification.findMany();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        userId: receiver.id,
        type: "CONNECTION_REQUEST",
        content: "Sender wants to connect with you.",
      });
    });

    it("announces the new request to the receiver", async () => {
      const [sender, receiver] = [await createUser(), await createUser()];

      const result = await service.sendRequest(sender.id, receiver.id);

      expect(dispatcher.emit).toHaveBeenCalledWith("notification:new", result.notification);
      expect(emittedPayload("request:new")).toEqual({
        receiverId: receiver.id,
        connection: result.receivedConnection,
      });
    });

    it("rejects a duplicate request (either direction) as a conflict, creating nothing", async () => {
      const [a, b] = [await createUser(), await createUser()];
      await service.sendRequest(a.id, b.id);

      await expect(service.sendRequest(a.id, b.id)).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(service.sendRequest(b.id, a.id)).rejects.toMatchObject({ code: "CONFLICT" });

      expect(await prisma.connection.count()).toBe(1);
    });

    it("rejects connecting to yourself as a validation failure", async () => {
      const a = await createUser();
      await expect(service.sendRequest(a.id, a.id)).rejects.toMatchObject({ code: "VALIDATION" });
    });
  });

  describe("acceptRequest", () => {
    it("marks the connection ACCEPTED, notifies the sender, and reads the original request", async () => {
      const [sender, receiver] = [await createUser(), await createUser({ name: "Receiver" })];
      const { receivedConnection } = await service.sendRequest(sender.id, receiver.id);

      await service.acceptRequest(receiver.id, receivedConnection.id);

      const connection = await prisma.connection.findUniqueOrThrow({ where: { id: receivedConnection.id } });
      expect(connection.status).toBe("ACCEPTED");

      const accepted = await prisma.notification.findFirst({
        where: { userId: sender.id, type: "CONNECTION_ACCEPTED" },
      });
      expect(accepted?.content).toBe("Receiver accepted your connection request.");

      const originalRequest = await prisma.notification.findFirst({
        where: { userId: receiver.id, type: "CONNECTION_REQUEST" },
      });
      expect(originalRequest?.isRead).toBe(true);
    });

    it("warms the presence cache for both parties and announces the acceptance", async () => {
      const [sender, receiver] = [await createUser(), await createUser()];
      const { receivedConnection } = await service.sendRequest(sender.id, receiver.id);

      const result = await service.acceptRequest(receiver.id, receivedConnection.id);

      expect(presence.setPresenceLookup).toHaveBeenCalledWith(sender.id, receiver.id);
      expect(emittedPayload("request:accepted")).toEqual({
        senderId: sender.id,
        connection: result.sentConnection,
      });
    });

    it("forbids accepting a request addressed to someone else, leaving it pending", async () => {
      const [sender, receiver, intruder] = [await createUser(), await createUser(), await createUser()];
      const { receivedConnection } = await service.sendRequest(sender.id, receiver.id);

      await expect(service.acceptRequest(intruder.id, receivedConnection.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      const connection = await prisma.connection.findUniqueOrThrow({ where: { id: receivedConnection.id } });
      expect(connection.status).toBe("PENDING");
    });

    it("reports a missing connection as not found", async () => {
      const user = await createUser();
      await expect(service.acceptRequest(user.id, "11111111-1111-1111-1111-111111111111")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("declineRequest / cancelRequest", () => {
    it("declineRequest deletes the connection + request notification and announces to the sender", async () => {
      const [sender, receiver] = [await createUser(), await createUser()];
      const { receivedConnection } = await service.sendRequest(sender.id, receiver.id);

      const returned = await service.declineRequest(receiver.id, receivedConnection.id);

      expect(returned).toBe(receivedConnection.id);
      expect(await prisma.connection.count()).toBe(0);
      expect(await prisma.notification.count({ where: { type: "CONNECTION_REQUEST" } })).toBe(0);
      expect(emittedPayload("request:declined")).toEqual({
        senderId: sender.id,
        receiverId: receiver.id,
        connectionId: receivedConnection.id,
      });
    });

    it("cancelRequest (by the sender) deletes it and announces to the receiver", async () => {
      const [sender, receiver] = [await createUser(), await createUser()];
      const { sentConnection } = await service.sendRequest(sender.id, receiver.id);

      const returned = await service.cancelRequest(sender.id, sentConnection.id);

      expect(returned).toBe(sentConnection.id);
      expect(await prisma.connection.count()).toBe(0);
      expect(emittedPayload("request:canceled")).toEqual({
        receiverId: receiver.id,
        senderId: sender.id,
        connectionId: sentConnection.id,
      });
    });

    it("forbids declining a request addressed to someone else", async () => {
      const [sender, receiver, intruder] = [await createUser(), await createUser(), await createUser()];
      const { receivedConnection } = await service.sendRequest(sender.id, receiver.id);

      await expect(service.declineRequest(intruder.id, receivedConnection.id)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(await prisma.connection.count()).toBe(1);
    });

    it("refuses to cancel a request that has already been accepted", async () => {
      const [sender, receiver] = [await createUser(), await createUser()];
      const { sentConnection } = await service.sendRequest(sender.id, receiver.id);
      await service.acceptRequest(receiver.id, sentConnection.id);

      await expect(service.cancelRequest(sender.id, sentConnection.id)).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await prisma.connection.count()).toBe(1);
    });
  });
});

describe("ConnectionsQuery (integration, real DB)", () => {
  describe("getUserContacts (keyset pagination)", () => {
    it("returns accepted counterparts and pages through them with no skips (real colliding timestamps)", async () => {
      const me = await createUser({ name: "Me" });
      // 25 accepted connections created back-to-back → many share updatedAt ms.
      for (let i = 0; i < 25; i++) {
        const other = await createUser();
        await createConnection({ senderId: me.id, receiverId: other.id, status: "ACCEPTED" });
      }

      const seen = new Set<string>();
      let cursor = "";
      let pages = 0;
      for (;;) {
        const page = await query.getUserContacts({ authUserId: me.id, limit: 10, cursor });
        page.contacts.forEach((c) => seen.add(c.id));
        pages++;
        if (!page.hasMore || !page.nextCursor) break;
        cursor = page.nextCursor;
      }

      expect(seen.size).toBe(25);
      expect(pages).toBe(3);
    });

    it("excludes non-accepted connections from contacts", async () => {
      const me = await createUser();
      const pendingPartner = await createUser();
      await createConnection({ senderId: me.id, receiverId: pendingPartner.id, status: "PENDING" });

      const { contacts } = await query.getUserContacts({ authUserId: me.id });
      expect(contacts).toHaveLength(0);
    });

    it("counts accepted contacts in both directions and ignores non-accepted ones", async () => {
      const me = await createUser();
      const [a, b, pending] = [await createUser(), await createUser(), await createUser()];
      // Accepted in both directions — both are contacts.
      await createConnection({ senderId: me.id, receiverId: a.id, status: "ACCEPTED" });
      await createConnection({ senderId: b.id, receiverId: me.id, status: "ACCEPTED" });
      await createConnection({ senderId: me.id, receiverId: pending.id, status: "PENDING" });

      expect((await query.getUserContacts({ authUserId: me.id })).total).toBe(2);
    });

    it("reports the full total even when a page is capped by the limit", async () => {
      const me = await createUser();
      for (let i = 0; i < 3; i++) {
        const other = await createUser();
        await createConnection({ senderId: me.id, receiverId: other.id, status: "ACCEPTED" });
      }

      const firstPage = await query.getUserContacts({ authUserId: me.id, limit: 2 });
      expect(firstPage.contacts).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.total).toBe(3);
    });

    it("narrows the total to the name search, so the badge matches the filtered list", async () => {
      const me = await createUser();
      const jane = await createUser({ name: "Jane Doe" });
      const alex = await createUser({ name: "Alex Roe" });
      await createConnection({ senderId: me.id, receiverId: jane.id, status: "ACCEPTED" });
      await createConnection({ senderId: alex.id, receiverId: me.id, status: "ACCEPTED" });

      expect((await query.getUserContacts({ authUserId: me.id })).total).toBe(2);

      const searched = await query.getUserContacts({ authUserId: me.id, query: "jane" });
      expect(searched.contacts.map((c) => c.name)).toEqual(["Jane Doe"]);
      expect(searched.total).toBe(1);
    });

    it("excludes another user's contacts from the total", async () => {
      const [me, stranger, theirFriend] = [await createUser(), await createUser(), await createUser()];
      await createConnection({ senderId: stranger.id, receiverId: theirFriend.id, status: "ACCEPTED" });

      expect((await query.getUserContacts({ authUserId: me.id })).total).toBe(0);
    });
  });

  describe("getContactIds", () => {
    it("returns the opposing user id for accepted connections in both directions", async () => {
      const me = await createUser();
      const [a, b, pending] = [await createUser(), await createUser(), await createUser()];
      await createConnection({ senderId: me.id, receiverId: a.id, status: "ACCEPTED" });
      await createConnection({ senderId: b.id, receiverId: me.id, status: "ACCEPTED" });
      await createConnection({ senderId: me.id, receiverId: pending.id, status: "PENDING" });

      expect(new Set(await query.getContactIds(me.id))).toEqual(new Set([a.id, b.id]));
    });
  });

  describe("getContactsOfContacts", () => {
    it("returns accepted edges among my contacts that don't involve me (friend-of-a-friend)", async () => {
      const me = await createUser();
      const [a, b, fof] = [await createUser(), await createUser(), await createUser()];
      // My direct contacts.
      await createConnection({ senderId: me.id, receiverId: a.id, status: "ACCEPTED" });
      await createConnection({ senderId: me.id, receiverId: b.id, status: "ACCEPTED" });
      // A friend-of-a-friend edge (a—fof) — the suggestion signal.
      await createConnection({ senderId: a.id, receiverId: fof.id, status: "ACCEPTED" });

      const edges = await query.getContactsOfContacts(me.id, [a.id, b.id]);

      // Only the a—fof edge qualifies: it's among my contacts and doesn't touch me.
      expect(edges).toEqual([{ senderId: a.id, receiverId: fof.id }]);
    });

    it("excludes edges that touch me directly and non-accepted edges", async () => {
      const me = await createUser();
      const [a, other] = [await createUser(), await createUser()];
      await createConnection({ senderId: me.id, receiverId: a.id, status: "ACCEPTED" }); // touches me
      await createConnection({ senderId: a.id, receiverId: other.id, status: "PENDING" }); // not accepted

      expect(await query.getContactsOfContacts(me.id, [a.id])).toEqual([]);
    });
  });

  describe("sent/received filtering", () => {
    it("separates sent vs received pending requests and counts received", async () => {
      const me = await createUser();
      const [x, y, z] = [await createUser(), await createUser(), await createUser()];
      await createConnection({ senderId: me.id, receiverId: x.id, status: "PENDING" }); // sent
      await createConnection({ senderId: y.id, receiverId: me.id, status: "PENDING" }); // received
      await createConnection({ senderId: z.id, receiverId: me.id, status: "PENDING" }); // received

      const sent = await query.getSentConnections({ authUserId: me.id });
      const received = await query.getReceivedConnections({ authUserId: me.id });
      const count = await query.getReceivedConnectionsCount({ authUserId: me.id });

      expect(sent.connections).toHaveLength(1);
      expect(received.connections).toHaveLength(2);
      expect(count).toBe(2);
      // Totals mirror each direction independently.
      expect(sent.total).toBe(1);
      expect(received.total).toBe(2);
    });

    it("projects each direction onto the counterpart's profile", async () => {
      const me = await createUser();
      const target = await createUser({ name: "Target" });
      await createConnection({ senderId: me.id, receiverId: target.id, status: "PENDING" });

      const sent = await query.getSentConnections({ authUserId: me.id });
      expect(sent.connections[0]?.user).toMatchObject({ id: target.id, name: "Target" });
    });

    it("scopes sent/received totals to PENDING only", async () => {
      const me = await createUser();
      const [a, b, c] = [await createUser(), await createUser(), await createUser()];
      await createConnection({ senderId: me.id, receiverId: a.id, status: "PENDING" });
      // Accepted/declined are contacts or dead requests — never pending-request badges.
      await createConnection({ senderId: me.id, receiverId: b.id, status: "ACCEPTED" });
      await createConnection({ senderId: c.id, receiverId: me.id, status: "ACCEPTED" });

      expect((await query.getSentConnections({ authUserId: me.id })).total).toBe(1);
      expect((await query.getReceivedConnections({ authUserId: me.id })).total).toBe(0);
    });

    it("reports the full total even when a page is capped by the limit", async () => {
      const me = await createUser();
      for (let i = 0; i < 3; i++) {
        const other = await createUser();
        await createConnection({ senderId: other.id, receiverId: me.id, status: "PENDING" });
      }

      const firstPage = await query.getReceivedConnections({ authUserId: me.id, limit: 2 });
      expect(firstPage.connections).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.total).toBe(3);
    });

    it("excludes another user's requests from the totals", async () => {
      const [me, stranger, other] = [await createUser(), await createUser(), await createUser()];
      await createConnection({ senderId: stranger.id, receiverId: other.id, status: "PENDING" });

      expect((await query.getSentConnections({ authUserId: me.id })).total).toBe(0);
      expect((await query.getReceivedConnections({ authUserId: me.id })).total).toBe(0);
    });
  });
});
