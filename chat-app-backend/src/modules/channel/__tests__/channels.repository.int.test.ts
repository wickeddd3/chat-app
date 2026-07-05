import { randomUUID } from "crypto";
import { ChannelsRepository } from "@/modules/channel/channels.repository";
import { prisma } from "@/test/helpers/db.helper";
import { addMember, createChannel, createMessage, createReceipt, createUser } from "@/test/factories";

const repo = new ChannelsRepository(prisma);

describe("ChannelsRepository (integration, real DB)", () => {
  describe("createDirectChannel / findExistingDirectChannel", () => {
    it("creates a DIRECT channel with both users as members, atomically", async () => {
      const [a, b] = [await createUser(), await createUser()];

      const channel = await repo.createDirectChannel(a.id, b.id);

      expect(channel.type).toBe("DIRECT");
      const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
      expect(members.map((m) => m.userId).sort()).toEqual([a.id, b.id].sort());
    });

    it("finds an existing direct channel regardless of member order", async () => {
      const [a, b] = [await createUser(), await createUser()];
      const created = await repo.createDirectChannel(a.id, b.id);

      expect((await repo.findExistingDirectChannel(a.id, b.id))?.id).toBe(created.id);
      expect((await repo.findExistingDirectChannel(b.id, a.id))?.id).toBe(created.id);
    });
  });

  describe("isMember (authorization guard)", () => {
    it("returns true for a member and false for a non-member", async () => {
      const [member, outsider] = [await createUser(), await createUser()];
      const channel = await createChannel({ authorId: member.id, type: "GROUP" });
      await addMember(channel.id, member.id);

      expect(await repo.isMember(member.id, channel.id)).toBe(true);
      expect(await repo.isMember(outsider.id, channel.id)).toBe(false);
    });

    it("returns false for a non-existent channel", async () => {
      const user = await createUser();
      expect(await repo.isMember(user.id, randomUUID())).toBe(false);
    });
  });

  describe("getChannels (inbox)", () => {
    it("hides a DIRECT channel until it has messages, then shows it", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const channel = await repo.createDirectChannel(me.id, other.id);

      expect((await repo.getChannels({ authUserId: me.id })).channels).toHaveLength(0);

      await createMessage({ channelId: channel.id, authorId: other.id });
      const withMessage = await repo.getChannels({ authUserId: me.id });
      expect(withMessage.channels.map((c) => c.id)).toEqual([channel.id]);
    });

    it("always shows GROUP channels and filters them by name search", async () => {
      const me = await createUser();
      await createChannel({ authorId: me.id, type: "GROUP", name: "Weekend Trip" }).then((c) => addMember(c.id, me.id));
      await createChannel({ authorId: me.id, type: "GROUP", name: "Book Club" }).then((c) => addMember(c.id, me.id));

      const all = await repo.getChannels({ authUserId: me.id });
      expect(all.channels).toHaveLength(2);

      const filtered = await repo.getChannels({ authUserId: me.id, query: "weekend" });
      expect(filtered.channels.map((c) => c.name)).toEqual(["Weekend Trip"]);
    });

    it("excludes channels the user is not a member of", async () => {
      const [me, stranger] = [await createUser(), await createUser()];
      await createChannel({ authorId: stranger.id, type: "GROUP" }).then((c) => addMember(c.id, stranger.id));

      expect((await repo.getChannels({ authUserId: me.id })).channels).toHaveLength(0);
    });

    it("paginates the inbox with no skips (real colliding timestamps)", async () => {
      const me = await createUser();
      for (let i = 0; i < 25; i++) {
        const channel = await createChannel({ authorId: me.id, type: "GROUP" });
        await addMember(channel.id, me.id);
      }

      const seen = new Set<string>();
      let cursor = "";
      let pages = 0;
      for (;;) {
        const page = await repo.getChannels({ authUserId: me.id, limit: 10, cursor });
        page.channels.forEach((c) => seen.add(c.id));
        pages++;
        if (!page.hasMore || !page.nextCursor) break;
        cursor = page.nextCursor;
      }
      expect(seen.size).toBe(25);
      expect(pages).toBe(3);
    });
  });

  describe("getUnreadMessagesCount", () => {
    it("counts only unread messages authored by others", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const channel = await createChannel({ authorId: me.id, type: "GROUP" });
      await addMember(channel.id, me.id);
      await addMember(channel.id, other.id);

      await createMessage({ channelId: channel.id, authorId: me.id }); // my own — never counts
      const read = await createMessage({ channelId: channel.id, authorId: other.id });
      await createMessage({ channelId: channel.id, authorId: other.id }); // unread
      await createReceipt(read.id, me.id);

      expect(await repo.getUnreadMessagesCount({ authUserId: me.id })).toBe(1);
    });
  });

  describe("createGroupChannel / updateGroupChannel", () => {
    it("creates a group with the creator as ADMIN and the rest as MEMBER", async () => {
      const [admin, m1, m2] = [await createUser(), await createUser(), await createUser()];

      const channel = await repo.createGroupChannel(admin.id, { name: "Team", memberIds: [m1.id, m2.id] });

      const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
      expect(members).toHaveLength(3);
      expect(members.find((m) => m.userId === admin.id)?.role).toBe("ADMIN");
      expect(
        members
          .filter((m) => m.role === "MEMBER")
          .map((m) => m.userId)
          .sort(),
      ).toEqual([m1.id, m2.id].sort());
    });

    it("updateGroupChannel (admin) renames and syncs the member list, keeping the admin", async () => {
      const [admin, m1, m2, m3] = [await createUser(), await createUser(), await createUser(), await createUser()];
      const channel = await repo.createGroupChannel(admin.id, { name: "Old", memberIds: [m1.id, m2.id] });

      await repo.updateGroupChannel(admin.id, channel.id, { name: "New", memberIds: [m2.id, m3.id] });

      const updated = await prisma.channel.findUniqueOrThrow({ where: { id: channel.id } });
      expect(updated.name).toBe("New");

      const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
      expect(members.map((m) => m.userId).sort()).toEqual([admin.id, m2.id, m3.id].sort());
      expect(members.find((m) => m.userId === admin.id)?.role).toBe("ADMIN");
    });

    it("updateGroupChannel rejects a non-admin", async () => {
      const [admin, member] = [await createUser(), await createUser()];
      const channel = await repo.createGroupChannel(admin.id, { name: "Team", memberIds: [member.id] });

      await expect(
        repo.updateGroupChannel(member.id, channel.id, { name: "Hijacked", memberIds: [] }),
      ).rejects.toMatchObject({ statusCode: 500 });
    });
  });
});
