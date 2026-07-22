import { UsersQuery } from "@/modules/user/persistence/users.query";
import { prisma } from "@/test/helpers/db.helper";
import { createConnection, createUser } from "@/test/factories";

const query = new UsersQuery(prisma);

describe("UsersQuery (integration, real DB)", () => {
  describe("search", () => {
    it("never returns the caller themselves", async () => {
      const me = await createUser({ name: "Me" });
      await createUser({ name: "Someone" });

      const results = await query.search({ userId: me.id });
      expect(results.map((u) => u.id)).not.toContain(me.id);
    });

    it("matches by name when a query is given", async () => {
      const me = await createUser();
      const jane = await createUser({ name: "Jane Doe" });
      await createUser({ name: "Alex Roe" });

      const results = await query.search({ userId: me.id, query: "jane" });
      expect(results.map((u) => u.id)).toEqual([jane.id]);
    });

    it("on the initial load (no query) excludes people I'm already connected to", async () => {
      const me = await createUser();
      const friend = await createUser({ name: "Friend" });
      const stranger = await createUser({ name: "Stranger" });
      await createConnection({ senderId: me.id, receiverId: friend.id, status: "ACCEPTED" });

      const results = await query.search({ userId: me.id });
      const ids = results.map((u) => u.id);
      expect(ids).toContain(stranger.id);
      expect(ids).not.toContain(friend.id);
    });

    it("carries the caller's own edge with each result for badge computation", async () => {
      const me = await createUser();
      const target = await createUser({ name: "Target" });
      // A pending request the caller sent — surfaces on a name search.
      await createConnection({ senderId: me.id, receiverId: target.id, status: "PENDING" });

      const [result] = await query.search({ userId: me.id, query: "target" });
      const edges = [...(result?.sentConnections ?? []), ...(result?.receivedConnections ?? [])];
      expect(edges).toHaveLength(1);
      expect(edges[0]).toMatchObject({ senderId: me.id, receiverId: target.id, status: "PENDING" });
    });

    it("honours the limit", async () => {
      const me = await createUser();
      for (let i = 0; i < 3; i++) await createUser();

      expect(await query.search({ userId: me.id, limit: 2 })).toHaveLength(2);
    });
  });

  describe("getByUsername", () => {
    it("returns the public profile for an existing username", async () => {
      const user = await createUser({ name: "Named", username: "handle-123" });

      const profile = await query.getByUsername("handle-123");
      expect(profile).toMatchObject({ id: user.id, name: "Named", username: "handle-123" });
    });

    it("returns null for an unknown username", async () => {
      expect(await query.getByUsername("nobody-here")).toBeNull();
    });
  });
});
