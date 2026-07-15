import { ConnectionsRepository } from "@/modules/connection/connections.repository";
import { prisma } from "@/test/helpers/db.helper";
import { createConnection, createUser } from "@/test/factories";

const repo = new ConnectionsRepository(prisma);

describe("ConnectionsRepository (integration, real DB)", () => {
  describe("sendRequest", () => {
    it("atomically creates a PENDING connection and a notification for the receiver", async () => {
      const [sender, receiver] = [await createUser({ name: "Sender" }), await createUser()];

      const result = await repo.sendRequest(sender.id, receiver.id);

      expect(result.sentConnection.status).toBe("PENDING");
      const connections = await prisma.connection.findMany();
      expect(connections).toHaveLength(1);
      expect(connections[0]).toMatchObject({ senderId: sender.id, receiverId: receiver.id, status: "PENDING" });

      const notifications = await prisma.notification.findMany();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({ userId: receiver.id, type: "CONNECTION_REQUEST" });
    });

    it("rejects a duplicate request (either direction) without creating anything", async () => {
      const [a, b] = [await createUser(), await createUser()];
      await repo.sendRequest(a.id, b.id);

      await expect(repo.sendRequest(a.id, b.id)).rejects.toMatchObject({ statusCode: 500 });
      await expect(repo.sendRequest(b.id, a.id)).rejects.toMatchObject({ statusCode: 500 });

      expect(await prisma.connection.count()).toBe(1);
    });

    it("rejects connecting to yourself", async () => {
      const a = await createUser();
      await expect(repo.sendRequest(a.id, a.id)).rejects.toMatchObject({ statusCode: 500 });
    });
  });

  describe("acceptRequest", () => {
    it("marks the connection ACCEPTED, notifies the sender, and reads the original request", async () => {
      const [sender, receiver] = [await createUser(), await createUser({ name: "Receiver" })];
      const { receivedConnection } = await repo.sendRequest(sender.id, receiver.id);

      await repo.acceptRequest(receiver.id, receivedConnection.id);

      const connection = await prisma.connection.findUniqueOrThrow({ where: { id: receivedConnection.id } });
      expect(connection.status).toBe("ACCEPTED");

      const accepted = await prisma.notification.findFirst({
        where: { userId: sender.id, type: "CONNECTION_ACCEPTED" },
      });
      expect(accepted).not.toBeNull();

      const originalRequest = await prisma.notification.findFirst({
        where: { userId: receiver.id, type: "CONNECTION_REQUEST" },
      });
      expect(originalRequest?.isRead).toBe(true);
    });

    it("rejects when the accepting user is not the receiver", async () => {
      const [sender, receiver, intruder] = [await createUser(), await createUser(), await createUser()];
      const { receivedConnection } = await repo.sendRequest(sender.id, receiver.id);

      await expect(repo.acceptRequest(intruder.id, receivedConnection.id)).rejects.toMatchObject({ statusCode: 500 });
    });
  });

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
        const page = await repo.getUserContacts({ authUserId: me.id, limit: 10, cursor });
        page.contacts.forEach((c) => c.id && seen.add(c.id));
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

      const { contacts } = await repo.getUserContacts({ authUserId: me.id });
      expect(contacts).toHaveLength(0);
    });

    it("counts accepted contacts in both directions and ignores non-accepted ones", async () => {
      const me = await createUser();
      const [a, b, pending] = [await createUser(), await createUser(), await createUser()];
      // Accepted in both directions — both are contacts.
      await createConnection({ senderId: me.id, receiverId: a.id, status: "ACCEPTED" });
      await createConnection({ senderId: b.id, receiverId: me.id, status: "ACCEPTED" });
      await createConnection({ senderId: me.id, receiverId: pending.id, status: "PENDING" });

      expect((await repo.getUserContacts({ authUserId: me.id })).total).toBe(2);
    });

    it("reports the full total even when a page is capped by the limit", async () => {
      const me = await createUser();
      for (let i = 0; i < 3; i++) {
        const other = await createUser();
        await createConnection({ senderId: me.id, receiverId: other.id, status: "ACCEPTED" });
      }

      const firstPage = await repo.getUserContacts({ authUserId: me.id, limit: 2 });
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

      expect((await repo.getUserContacts({ authUserId: me.id })).total).toBe(2);

      const searched = await repo.getUserContacts({ authUserId: me.id, query: "jane" });
      expect(searched.contacts.map((c) => c.name)).toEqual(["Jane Doe"]);
      expect(searched.total).toBe(1);
    });

    it("excludes another user's contacts from the total", async () => {
      const [me, stranger, theirFriend] = [await createUser(), await createUser(), await createUser()];
      await createConnection({ senderId: stranger.id, receiverId: theirFriend.id, status: "ACCEPTED" });

      expect((await repo.getUserContacts({ authUserId: me.id })).total).toBe(0);
    });
  });

  describe("sent/received filtering", () => {
    it("separates sent vs received pending requests and counts received", async () => {
      const me = await createUser();
      const [x, y, z] = [await createUser(), await createUser(), await createUser()];
      await createConnection({ senderId: me.id, receiverId: x.id, status: "PENDING" }); // sent
      await createConnection({ senderId: y.id, receiverId: me.id, status: "PENDING" }); // received
      await createConnection({ senderId: z.id, receiverId: me.id, status: "PENDING" }); // received

      const sent = await repo.getSentConnections({ authUserId: me.id });
      const received = await repo.getReceivedConnections({ authUserId: me.id });
      const count = await repo.getReceivedConnectionsCount({ authUserId: me.id });

      expect(sent.connections).toHaveLength(1);
      expect(received.connections).toHaveLength(2);
      expect(count).toBe(2);
    });
  });

  describe("declineRequest / cancelRequest", () => {
    it("declineRequest deletes the connection + request notification and returns the sender id", async () => {
      const [sender, receiver] = [await createUser(), await createUser()];
      const { receivedConnection } = await repo.sendRequest(sender.id, receiver.id);

      const returned = await repo.declineRequest(receiver.id, receivedConnection.id);

      expect(returned).toBe(sender.id);
      expect(await prisma.connection.count()).toBe(0);
      expect(await prisma.notification.count({ where: { type: "CONNECTION_REQUEST" } })).toBe(0);
    });

    it("cancelRequest (by the sender) deletes it and returns the receiver id", async () => {
      const [sender, receiver] = [await createUser(), await createUser()];
      const { sentConnection } = await repo.sendRequest(sender.id, receiver.id);

      const returned = await repo.cancelRequest(sender.id, sentConnection.id);

      expect(returned).toBe(receiver.id);
      expect(await prisma.connection.count()).toBe(0);
    });

    it("declineRequest rejects when the user is not the receiver", async () => {
      const [sender, receiver, intruder] = [await createUser(), await createUser(), await createUser()];
      const { receivedConnection } = await repo.sendRequest(sender.id, receiver.id);

      await expect(repo.declineRequest(intruder.id, receivedConnection.id)).rejects.toMatchObject({ statusCode: 500 });
      expect(await prisma.connection.count()).toBe(1);
    });
  });
});
