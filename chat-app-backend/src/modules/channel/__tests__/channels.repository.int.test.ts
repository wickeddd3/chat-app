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

  describe("isChannelAdmin (group-management guard)", () => {
    it("returns true only for an ADMIN member", async () => {
      const [admin, member, outsider] = [await createUser(), await createUser(), await createUser()];
      const channel = await createChannel({ authorId: admin.id, type: "GROUP" });
      await addMember(channel.id, admin.id, "ADMIN");
      await addMember(channel.id, member.id, "MEMBER");

      expect(await repo.isChannelAdmin(admin.id, channel.id)).toBe(true);
      expect(await repo.isChannelAdmin(member.id, channel.id)).toBe(false);
      expect(await repo.isChannelAdmin(outsider.id, channel.id)).toBe(false);
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

    it("filter=groups returns only GROUP channels, with a matching total", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const group = await createChannel({ authorId: me.id, type: "GROUP", name: "Team" });
      await addMember(group.id, me.id);
      const direct = await repo.createDirectChannel(me.id, other.id);
      await createMessage({ channelId: direct.id, authorId: other.id });

      const res = await repo.getChannels({ authUserId: me.id, filter: "groups" });
      expect(res.channels.map((c) => c.id)).toEqual([group.id]);
      expect(res.total).toBe(1);
    });

    it("filter=unread returns only channels with unread messages from others; total drops after reading", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const direct = await repo.createDirectChannel(me.id, other.id);
      const msg = await createMessage({ channelId: direct.id, authorId: other.id });

      // A group where the only message is my own → never counts as unread.
      const group = await createChannel({ authorId: me.id, type: "GROUP", name: "Solo" });
      await addMember(group.id, me.id);
      await createMessage({ channelId: group.id, authorId: me.id });

      const unread = await repo.getChannels({ authUserId: me.id, filter: "unread" });
      expect(unread.channels.map((c) => c.id)).toEqual([direct.id]);
      expect(unread.total).toBe(1);

      // Reading the message removes the channel from the unread set.
      await createReceipt(msg.id, me.id);
      const afterRead = await repo.getChannels({ authUserId: me.id, filter: "unread" });
      expect(afterRead.channels).toHaveLength(0);
      expect(afterRead.total).toBe(0);
    });

    it("reports the full filtered total even when a page is capped by the limit", async () => {
      const me = await createUser();
      for (let i = 0; i < 3; i++) {
        const g = await createChannel({ authorId: me.id, type: "GROUP", name: `G${i}` });
        await addMember(g.id, me.id);
      }

      const firstPage = await repo.getChannels({ authUserId: me.id, filter: "groups", limit: 2 });
      expect(firstPage.channels).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.total).toBe(3);
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
