import { randomUUID } from "crypto";
import { ChannelsService } from "@/modules/channel/channels.service";
import { ChannelsQuery } from "@/modules/channel/persistence/channels.query";
import { ChannelsRepository } from "@/modules/channel/persistence/channels.repository";
import { ChannelMembersRepository } from "@/modules/channel/persistence/channel-members.repository";
import { ConnectionsQuery } from "@/modules/connection/persistence/connections.query";
import { TransactionManager } from "@/shared/persistence/transaction";
import type { PresenceService } from "@/services/presence.service";
import { prisma } from "@/test/helpers/db.helper";
import { addMember, createChannel, createConnection, createMessage, createReceipt, createUser } from "@/test/factories";

// Reads run through the query, membership guards through the member repository,
// and the two-table writes through the service (which orchestrates the real
// repositories in a real transaction). Presence is the only mocked collaborator.
const query = new ChannelsQuery(prisma);
const channelsRepo = new ChannelsRepository(prisma);
const membersRepo = new ChannelMembersRepository(prisma);
const connectionsQuery = new ConnectionsQuery(prisma);
const transactions = new TransactionManager(prisma);
const presence = { refreshChannelMembersLookup: jest.fn().mockResolvedValue(undefined) };

const service = new ChannelsService(
  query,
  channelsRepo,
  membersRepo,
  connectionsQuery,
  transactions,
  presence as unknown as PresenceService,
);

beforeEach(() => presence.refreshChannelMembersLookup.mockClear());

describe("ChannelsService (integration, real DB)", () => {
  describe("findChannelOrCreate", () => {
    it("creates a DIRECT channel with both users as members, atomically", async () => {
      const [a, b] = [await createUser(), await createUser()];

      const channel = await service.findChannelOrCreate(a.id, b.id);

      expect(channel.type).toBe("DIRECT");
      const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
      expect(members.map((m) => m.userId).sort()).toEqual([a.id, b.id].sort());
    });

    it("returns the existing direct channel regardless of member order, creating nothing new", async () => {
      const [a, b] = [await createUser(), await createUser()];
      const created = await service.findChannelOrCreate(a.id, b.id);

      expect((await service.findChannelOrCreate(a.id, b.id)).id).toBe(created.id);
      expect((await service.findChannelOrCreate(b.id, a.id)).id).toBe(created.id);
      expect(await prisma.channel.count()).toBe(1);
    });
  });

  describe("createGroupChannel", () => {
    it("creates a group with the creator as ADMIN and the rest as MEMBER", async () => {
      const [admin, m1, m2] = [await createUser(), await createUser(), await createUser()];

      const channel = await service.createGroupChannel(admin.id, { name: "Team", memberIds: [m1.id, m2.id] });

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
  });

  describe("updateGroupChannel", () => {
    it("renames and syncs the member list (keeping the admin), then refreshes the cached roster", async () => {
      const [admin, m1, m2, m3] = [await createUser(), await createUser(), await createUser(), await createUser()];
      const channel = await service.createGroupChannel(admin.id, { name: "Old", memberIds: [m1.id, m2.id] });

      await service.updateGroupChannel(admin.id, channel.id, { name: "New", memberIds: [m2.id, m3.id] });

      const updated = await prisma.channel.findUniqueOrThrow({ where: { id: channel.id } });
      expect(updated.name).toBe("New");

      const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
      expect(members.map((m) => m.userId).sort()).toEqual([admin.id, m2.id, m3.id].sort());
      expect(members.find((m) => m.userId === admin.id)?.role).toBe("ADMIN");

      expect(presence.refreshChannelMembersLookup).toHaveBeenCalledWith(channel.id, [admin.id, m2.id, m3.id]);
    });

    it("forbids a non-admin, leaving the channel unchanged", async () => {
      const [admin, member] = [await createUser(), await createUser()];
      const channel = await service.createGroupChannel(admin.id, { name: "Team", memberIds: [member.id] });

      await expect(
        service.updateGroupChannel(member.id, channel.id, { name: "Hijacked", memberIds: [] }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      const unchanged = await prisma.channel.findUniqueOrThrow({ where: { id: channel.id } });
      expect(unchanged.name).toBe("Team");
      expect(presence.refreshChannelMembersLookup).not.toHaveBeenCalled();
    });
  });

  describe("canMessage", () => {
    /** A direct channel between two users, plus one message of history. */
    async function buildDirectThread(status?: "PENDING" | "ACCEPTED") {
      const [a, b] = [await createUser(), await createUser()];
      if (status) await createConnection({ senderId: a.id, receiverId: b.id, status });

      const channel = await service.findChannelOrCreate(a.id, b.id);
      await createMessage({ channelId: channel.id, authorId: a.id, content: "hello" });

      return { a, b, channel };
    }

    it("allows a direct channel while the two are connected", async () => {
      const { a, channel } = await buildDirectThread("ACCEPTED");

      await expect(service.canMessage(a.id, channel.id)).resolves.toBe(true);
    });

    it("closes the channel once the connection is gone, but keeps the history readable", async () => {
      const { a, b, channel } = await buildDirectThread("ACCEPTED");
      await prisma.connection.deleteMany({});

      await expect(service.canMessage(a.id, channel.id)).resolves.toBe(false);
      await expect(service.canMessage(b.id, channel.id)).resolves.toBe(false);

      // The point of the feature: the thread survives the removal.
      const stillThere = await service.getChannel(a.id, channel.id);
      expect(stillThere?.messages).toHaveLength(1);
      expect(await prisma.message.count({ where: { channelId: channel.id } })).toBe(1);
    });

    it("does not open on a merely pending request", async () => {
      const { a, channel } = await buildDirectThread("PENDING");

      await expect(service.canMessage(a.id, channel.id)).resolves.toBe(false);
    });

    it("leaves groups alone — membership is the permission there", async () => {
      const [creator, member] = [await createUser(), await createUser()];
      const channel = await service.createGroupChannel(creator.id, { name: "Team", memberIds: [member.id] });

      // No connection row exists between them at all.
      await expect(service.canMessage(creator.id, channel.id)).resolves.toBe(true);
      await expect(service.canMessage(member.id, channel.id)).resolves.toBe(true);
    });

    it("treats a non-member as unable to post", async () => {
      const { channel } = await buildDirectThread("ACCEPTED");
      const outsider = await createUser();

      // getDirectCounterpartId is membership-scoped, so an outsider resolves to
      // no counterpart — but `isMember` is the guard that actually rejects them.
      await expect(service.isMember(outsider.id, channel.id)).resolves.toBe(false);
    });
  });
});

describe("ChannelMembersRepository (integration, real DB)", () => {
  describe("isMember / isAdmin (authorization guards)", () => {
    it("isMember is true for a member, false for a non-member and a missing channel", async () => {
      const [member, outsider] = [await createUser(), await createUser()];
      const channel = await createChannel({ authorId: member.id, type: "GROUP" });
      await addMember(channel.id, member.id);

      expect(await membersRepo.isMember(member.id, channel.id)).toBe(true);
      expect(await membersRepo.isMember(outsider.id, channel.id)).toBe(false);
      expect(await membersRepo.isMember(member.id, randomUUID())).toBe(false);
    });

    it("isAdmin is true only for an ADMIN member", async () => {
      const [admin, member, outsider] = [await createUser(), await createUser(), await createUser()];
      const channel = await createChannel({ authorId: admin.id, type: "GROUP" });
      await addMember(channel.id, admin.id, "ADMIN");
      await addMember(channel.id, member.id, "MEMBER");

      expect(await membersRepo.isAdmin(admin.id, channel.id)).toBe(true);
      expect(await membersRepo.isAdmin(member.id, channel.id)).toBe(false);
      expect(await membersRepo.isAdmin(outsider.id, channel.id)).toBe(false);
    });
  });

  describe("getMemberIds (membership-gated)", () => {
    it("returns the roster to a member and nothing to a non-member", async () => {
      const [me, other, outsider] = [await createUser(), await createUser(), await createUser()];
      const channel = await service.createGroupChannel(me.id, { name: "Team", memberIds: [other.id] });

      expect(new Set(await membersRepo.getMemberIds(me.id, channel.id))).toEqual(new Set([me.id, other.id]));
      expect(await membersRepo.getMemberIds(outsider.id, channel.id)).toEqual([]);
    });
  });
});

describe("ChannelsQuery (integration, real DB)", () => {
  describe("getChannels (inbox)", () => {
    it("hides a DIRECT channel until it has messages, then shows it", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const channel = await service.findChannelOrCreate(me.id, other.id);

      expect((await query.getChannels({ authUserId: me.id })).channels).toHaveLength(0);

      await createMessage({ channelId: channel.id, authorId: other.id });
      const withMessage = await query.getChannels({ authUserId: me.id });
      expect(withMessage.channels.map((c) => c.id)).toEqual([channel.id]);
    });

    it("always shows GROUP channels and filters them by name search", async () => {
      const me = await createUser();
      await createChannel({ authorId: me.id, type: "GROUP", name: "Weekend Trip" }).then((c) => addMember(c.id, me.id));
      await createChannel({ authorId: me.id, type: "GROUP", name: "Book Club" }).then((c) => addMember(c.id, me.id));

      expect((await query.getChannels({ authUserId: me.id })).channels).toHaveLength(2);

      const filtered = await query.getChannels({ authUserId: me.id, query: "weekend" });
      expect(filtered.channels.map((c) => c.name)).toEqual(["Weekend Trip"]);
    });

    it("filter=groups returns only GROUP channels, with a matching total", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const group = await createChannel({ authorId: me.id, type: "GROUP", name: "Team" });
      await addMember(group.id, me.id);
      const direct = await service.findChannelOrCreate(me.id, other.id);
      await createMessage({ channelId: direct.id, authorId: other.id });

      const res = await query.getChannels({ authUserId: me.id, filter: "groups" });
      expect(res.channels.map((c) => c.id)).toEqual([group.id]);
      expect(res.total).toBe(1);
    });

    it("filter=unread returns only channels with unread messages from others; total drops after reading", async () => {
      const [me, other] = [await createUser(), await createUser()];
      const direct = await service.findChannelOrCreate(me.id, other.id);
      const msg = await createMessage({ channelId: direct.id, authorId: other.id });

      // A group where the only message is my own → never counts as unread.
      const group = await createChannel({ authorId: me.id, type: "GROUP", name: "Solo" });
      await addMember(group.id, me.id);
      await createMessage({ channelId: group.id, authorId: me.id });

      const unread = await query.getChannels({ authUserId: me.id, filter: "unread" });
      expect(unread.channels.map((c) => c.id)).toEqual([direct.id]);
      expect(unread.total).toBe(1);

      await createReceipt(msg.id, me.id);
      const afterRead = await query.getChannels({ authUserId: me.id, filter: "unread" });
      expect(afterRead.channels).toHaveLength(0);
      expect(afterRead.total).toBe(0);
    });

    it("reports the full filtered total even when a page is capped by the limit", async () => {
      const me = await createUser();
      for (let i = 0; i < 3; i++) {
        const g = await createChannel({ authorId: me.id, type: "GROUP", name: `G${i}` });
        await addMember(g.id, me.id);
      }

      const firstPage = await query.getChannels({ authUserId: me.id, filter: "groups", limit: 2 });
      expect(firstPage.channels).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.total).toBe(3);
    });

    it("excludes channels the user is not a member of", async () => {
      const [me, stranger] = [await createUser(), await createUser()];
      await createChannel({ authorId: stranger.id, type: "GROUP" }).then((c) => addMember(c.id, stranger.id));

      expect((await query.getChannels({ authUserId: me.id })).channels).toHaveLength(0);
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
        const page = await query.getChannels({ authUserId: me.id, limit: 10, cursor });
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

      expect(await query.getUnreadMessagesCount({ authUserId: me.id })).toBe(1);
    });
  });
});
