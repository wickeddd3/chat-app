import { NotificationsQuery } from "@/modules/notification/persistence/notifications.query";
import { prisma } from "@/test/helpers/db.helper";
import { createNotification, createUser } from "@/test/factories";

const query = new NotificationsQuery(prisma);

describe("NotificationsQuery (integration, real DB)", () => {
  describe("getByUserId (keyset pagination + filter)", () => {
    it("returns a user's notifications newest-first and pages with no skips", async () => {
      const user = await createUser();
      const base = Date.UTC(2026, 0, 1);
      for (let i = 0; i < 25; i++) {
        await createNotification({ userId: user.id, createdAt: new Date(base + i * 60_000) });
      }

      const seen = new Set<string>();
      let cursor: string | undefined;
      let pages = 0;
      let prevTime = Infinity;
      for (;;) {
        const page = await query.getByUserId({ userId: user.id, limit: 10, ...(cursor && { cursor }) });
        for (const n of page.notifications) {
          seen.add(n.id);
          // Descending by createdAt.
          expect(n.createdAt.getTime()).toBeLessThanOrEqual(prevTime);
          prevTime = n.createdAt.getTime();
        }
        pages++;
        if (!page.hasMore || !page.nextCursor) break;
        cursor = page.nextCursor;
      }

      expect(seen.size).toBe(25);
      expect(pages).toBe(3);
    });

    it("applies the isRead filter", async () => {
      const user = await createUser();
      await createNotification({ userId: user.id, isRead: false });
      await createNotification({ userId: user.id, isRead: false });
      await createNotification({ userId: user.id, isRead: true });

      expect((await query.getByUserId({ userId: user.id, isRead: false })).notifications).toHaveLength(2);
      expect((await query.getByUserId({ userId: user.id, isRead: true })).notifications).toHaveLength(1);
      expect((await query.getByUserId({ userId: user.id })).notifications).toHaveLength(3);
    });

    it("only returns the requested user's notifications", async () => {
      const [me, other] = [await createUser(), await createUser()];
      await createNotification({ userId: me.id });
      await createNotification({ userId: other.id });

      const mine = await query.getByUserId({ userId: me.id });
      expect(mine.notifications).toHaveLength(1);
    });

    it("reports a total that matches the isRead filter", async () => {
      const user = await createUser();
      await createNotification({ userId: user.id, isRead: false });
      await createNotification({ userId: user.id, isRead: false });
      await createNotification({ userId: user.id, isRead: true });

      expect((await query.getByUserId({ userId: user.id })).total).toBe(3);
      expect((await query.getByUserId({ userId: user.id, isRead: false })).total).toBe(2);
      expect((await query.getByUserId({ userId: user.id, isRead: true })).total).toBe(1);
    });

    it("reports the full filtered total even when a page is capped by the limit", async () => {
      const user = await createUser();
      for (let i = 0; i < 3; i++) {
        await createNotification({ userId: user.id, isRead: false });
      }

      const firstPage = await query.getByUserId({ userId: user.id, isRead: false, limit: 2 });
      expect(firstPage.notifications).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.total).toBe(3);
    });

    it("excludes another user's notifications from the total", async () => {
      const [me, other] = [await createUser(), await createUser()];
      await createNotification({ userId: me.id });
      await createNotification({ userId: other.id });

      expect((await query.getByUserId({ userId: me.id })).total).toBe(1);
    });
  });

  describe("getUnreadNotificationsCount", () => {
    it("counts only the user's unread notifications", async () => {
      const [me, other] = [await createUser(), await createUser()];
      await createNotification({ userId: me.id, isRead: false });
      await createNotification({ userId: me.id, isRead: false });
      await createNotification({ userId: me.id, isRead: true });
      await createNotification({ userId: other.id, isRead: false });

      expect(await query.getUnreadNotificationsCount({ authUserId: me.id })).toBe(2);
    });
  });
});
