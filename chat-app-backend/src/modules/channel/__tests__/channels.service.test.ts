import { TYPES } from "@/config/types";
import { ChannelsService } from "@/modules/channel/channels.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("ChannelsService (DI container + mocked collaborators)", () => {
  let query: { getChannels: jest.Mock };
  let repo: {
    findExistingDirect: jest.Mock;
    createDirect: jest.Mock;
    createGroup: jest.Mock;
    rename: jest.Mock;
    touch: jest.Mock;
  };
  let members: { isAdmin: jest.Mock; addMembers: jest.Mock; replaceMembers: jest.Mock };
  let transaction: { run: jest.Mock };
  let presence: { refreshChannelMembersLookup: jest.Mock };
  let service: ChannelsService;

  beforeEach(() => {
    query = { getChannels: jest.fn() };
    repo = {
      findExistingDirect: jest.fn(),
      createDirect: jest.fn().mockResolvedValue({ id: "c1", type: "DIRECT" }),
      createGroup: jest.fn().mockResolvedValue({ id: "c1", type: "GROUP" }),
      rename: jest.fn().mockResolvedValue({ id: "c1", name: "Renamed" }),
      touch: jest.fn(),
    };
    members = {
      isAdmin: jest.fn().mockResolvedValue(true),
      addMembers: jest.fn().mockResolvedValue(undefined),
      replaceMembers: jest.fn().mockResolvedValue(undefined),
    };
    // Runs the unit of work inline; the executor object is never inspected.
    transaction = { run: jest.fn((work: (tx: unknown) => Promise<unknown>) => work({})) };
    presence = { refreshChannelMembersLookup: jest.fn().mockResolvedValue(undefined) };

    const container = buildTestContainer([
      [TYPES.ChannelsQuery, query],
      [TYPES.ChannelsRepository, repo],
      [TYPES.ChannelMembersRepository, members],
      [TYPES.TransactionManager, transaction],
      [TYPES.PresenceService, presence],
    ]);
    container.bind<ChannelsService>(TYPES.ChannelsService).to(ChannelsService);
    service = container.get<ChannelsService>(TYPES.ChannelsService);
  });

  it("delegates the inbox list to the query side unchanged", async () => {
    const payload = { channels: [], hasMore: false, nextCursor: null, total: 0 };
    query.getChannels.mockResolvedValue(payload);

    await expect(service.getChannels({ authUserId: "u1" })).resolves.toBe(payload);
    expect(query.getChannels).toHaveBeenCalledWith({ authUserId: "u1" });
  });

  it("propagates a query failure unchanged rather than masking it as a 500", async () => {
    const underlying = new Error("pool exhausted");
    query.getChannels.mockRejectedValue(underlying);

    await expect(service.getChannels({ authUserId: "u1" })).rejects.toBe(underlying);
  });

  describe("findChannelOrCreate", () => {
    it("returns the existing direct channel without opening a transaction", async () => {
      const existing = { id: "c1" };
      repo.findExistingDirect.mockResolvedValue(existing);

      await expect(service.findChannelOrCreate("u1", "u2")).resolves.toBe(existing);
      expect(transaction.run).not.toHaveBeenCalled();
      expect(repo.createDirect).not.toHaveBeenCalled();
    });

    it("creates the channel and both memberships in one transaction when none exists", async () => {
      repo.findExistingDirect.mockResolvedValue(null);

      const created = await service.findChannelOrCreate("u1", "u2");

      expect(created).toMatchObject({ id: "c1", type: "DIRECT" });
      expect(repo.createDirect).toHaveBeenCalledWith("u1", "u2", {});
      expect(members.addMembers).toHaveBeenCalledWith(
        [
          { channelId: "c1", userId: "u1", role: "MEMBER" },
          { channelId: "c1", userId: "u2", role: "MEMBER" },
        ],
        {},
      );
    });
  });

  describe("createGroupChannel", () => {
    it("creates the group and inserts the creator as ADMIN plus deduped members", async () => {
      await service.createGroupChannel("admin", { name: "Team", memberIds: ["admin", "u2", "u3"] });

      expect(repo.createGroup).toHaveBeenCalledWith("admin", "Team", {});
      expect(members.addMembers).toHaveBeenCalledWith(
        [
          { channelId: "c1", userId: "admin", role: "ADMIN" },
          { channelId: "c1", userId: "u2", role: "MEMBER" },
          { channelId: "c1", userId: "u3", role: "MEMBER" },
        ],
        {},
      );
    });
  });

  describe("updateGroupChannel", () => {
    it("forbids a non-admin before touching the channel", async () => {
      members.isAdmin.mockResolvedValue(false);

      await expect(
        service.updateGroupChannel("member", "c1", { name: "Hijacked", memberIds: [] }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      expect(transaction.run).not.toHaveBeenCalled();
      expect(repo.rename).not.toHaveBeenCalled();
    });

    it("renames and replaces the roster, then rewrites the cached member set", async () => {
      await service.updateGroupChannel("admin", "c1", { name: "Team", memberIds: ["admin", "u2", "u3"] });

      expect(repo.rename).toHaveBeenCalledWith("c1", "Team", {});
      expect(members.replaceMembers).toHaveBeenCalledWith(
        "c1",
        [
          { channelId: "c1", userId: "admin", role: "ADMIN" },
          { channelId: "c1", userId: "u2", role: "MEMBER" },
          { channelId: "c1", userId: "u3", role: "MEMBER" },
        ],
        {},
      );
      expect(presence.refreshChannelMembersLookup).toHaveBeenCalledWith("c1", ["admin", "u2", "u3"]);
    });

    it("does not fail the update when the cache refresh rejects", async () => {
      presence.refreshChannelMembersLookup.mockRejectedValue(new Error("redis down"));

      await expect(
        service.updateGroupChannel("admin", "c1", { name: "Team", memberIds: ["u2"] }),
      ).resolves.toMatchObject({ id: "c1" });
    });
  });
});
