import { randomUUID } from "crypto";
import { NotificationsRepository } from "@/modules/notification/persistence/notifications.repository";
import { prisma } from "@/test/helpers/db.helper";
import { createNotification, createUser } from "@/test/factories";

const repo = new NotificationsRepository(prisma);

describe("NotificationsRepository (integration, real DB)", () => {
  describe("create", () => {
    it("persists a notification composed by another module", async () => {
      const user = await createUser();

      const notification = await repo.create({
        userId: user.id,
        type: "CONNECTION_REQUEST",
        title: "New Connection Request",
        content: "Someone wants to connect.",
        referenceId: "conn-1",
      });

      expect(notification).toMatchObject({ userId: user.id, type: "CONNECTION_REQUEST", isRead: false });
      expect(await prisma.notification.findUnique({ where: { id: notification.id } })).not.toBeNull();
    });
  });

  describe("markReadByReference", () => {
    it("marks the user's notifications for a subject as read", async () => {
      const user = await createUser();
      await createNotification({ userId: user.id, referenceId: "conn-1", isRead: false });

      await repo.markReadByReference({ referenceId: "conn-1", userId: user.id });

      const rows = await prisma.notification.findMany({ where: { referenceId: "conn-1" } });
      expect(rows.every((n) => n.isRead)).toBe(true);
    });
  });

  describe("deleteByReference", () => {
    it("removes the user's notifications of a given type for a subject", async () => {
      const user = await createUser();
      await createNotification({ userId: user.id, type: "CONNECTION_REQUEST", referenceId: "conn-1" });

      await repo.deleteByReference({ referenceId: "conn-1", userId: user.id, type: "CONNECTION_REQUEST" });

      expect(await prisma.notification.count({ where: { referenceId: "conn-1" } })).toBe(0);
    });
  });

  describe("markAsRead", () => {
    it("marks only the given ids belonging to the user", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const n1 = await createNotification({ userId: me.id, isRead: false });
      const n2 = await createNotification({ userId: me.id, isRead: false });
      const foreign = await createNotification({ userId: other.id, isRead: false });

      const { count } = await repo.markAsRead({ userId: me.id, notificationIds: [n1.id, n2.id, foreign.id] });

      expect(count).toBe(2); // foreign one is not the user's, so it's ignored
      expect((await prisma.notification.findUniqueOrThrow({ where: { id: n1.id } })).isRead).toBe(true);
      expect((await prisma.notification.findUniqueOrThrow({ where: { id: n2.id } })).isRead).toBe(true);
      expect((await prisma.notification.findUniqueOrThrow({ where: { id: foreign.id } })).isRead).toBe(false);
    });

    it("counts only newly-read notifications (already-read ones yield 0)", async () => {
      const me = await createUser();
      const alreadyRead = await createNotification({ userId: me.id, isRead: true });
      const unread = await createNotification({ userId: me.id, isRead: false });

      // Re-marking an already-read notification changes nothing.
      expect((await repo.markAsRead({ userId: me.id, notificationIds: [alreadyRead.id] })).count).toBe(0);
      // A mixed batch counts only the ones actually flipped.
      expect((await repo.markAsRead({ userId: me.id, notificationIds: [alreadyRead.id, unread.id] })).count).toBe(1);
    });

    it("ignores unknown ids", async () => {
      const me = await createUser();

      expect((await repo.markAsRead({ userId: me.id, notificationIds: [randomUUID()] })).count).toBe(0);
    });
  });
});
