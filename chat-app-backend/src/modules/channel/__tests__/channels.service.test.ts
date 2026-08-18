import { TYPES } from "@/config/types";
import { ChannelsService } from "@/modules/channel/channels.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("ChannelsService (DI container + mocked collaborators)", () => {
  let query: {
    getChannels: jest.Mock;
    getDirectCounterpartId: jest.Mock;
    getChannelSummary: jest.Mock;
  };
  let repo: {
    findExistingDirect: jest.Mock;
    createDirect: jest.Mock;
    createGroup: jest.Mock;
    rename: jest.Mock;
    touch: jest.Mock;
    delete: jest.Mock;
  };
  let members: {
    isAdmin: jest.Mock;
    isMember: jest.Mock;
    addMembers: jest.Mock;
    replaceMembers: jest.Mock;
    listMembers: jest.Mock;
    removeMember: jest.Mock;
    promoteToAdmin: jest.Mock;
  };
  let messages: { create: jest.Mock };
  let dispatcher: { emit: jest.Mock };
  let connections: { areConnected: jest.Mock };
  let transaction: { run: jest.Mock };
  let presence: { refreshChannelMembersLookup: jest.Mock };
  let service: ChannelsService;

  beforeEach(() => {
    query = {
      getChannels: jest.fn(),
      getDirectCounterpartId: jest.fn().mockResolvedValue(null),
      getChannelSummary: jest.fn().mockResolvedValue({ id: "c1", type: "GROUP" }),
    };
    repo = {
      findExistingDirect: jest.fn(),
      createDirect: jest.fn().mockResolvedValue({ id: "c1", type: "DIRECT" }),
      createGroup: jest.fn().mockResolvedValue({ id: "c1", type: "GROUP" }),
      rename: jest.fn().mockResolvedValue({ id: "c1", name: "Renamed" }),
      touch: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    members = {
      isAdmin: jest.fn().mockResolvedValue(true),
      isMember: jest.fn().mockResolvedValue(true),
      addMembers: jest.fn().mockResolvedValue(undefined),
      replaceMembers: jest.fn().mockResolvedValue(undefined),
      listMembers: jest.fn().mockResolvedValue([]),
      removeMember: jest.fn().mockResolvedValue(undefined),
      promoteToAdmin: jest.fn().mockResolvedValue(undefined),
    };
    messages = { create: jest.fn().mockResolvedValue({ id: "m1", content: "Ada left the group" }) };
    dispatcher = { emit: jest.fn() };
    connections = { areConnected: jest.fn().mockResolvedValue(true) };
    // Runs the unit of work inline; the executor object is never inspected.
    transaction = { run: jest.fn((work: (tx: unknown) => Promise<unknown>) => work({})) };
    presence = { refreshChannelMembersLookup: jest.fn().mockResolvedValue(undefined) };

    const container = buildTestContainer([
      [TYPES.ChannelsQuery, query],
      [TYPES.ChannelsRepository, repo],
      [TYPES.ChannelMembersRepository, members],
      [TYPES.ConnectionsQuery, connections],
      [TYPES.MessagesRepository, messages],
      [TYPES.TransactionManager, transaction],
      [TYPES.EventDispatcher, dispatcher],
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

  describe("canMessage", () => {
    it("lets a group through without consulting the connection graph", async () => {
      query.getDirectCounterpartId.mockResolvedValue(null);

      await expect(service.canMessage("u1", "c1")).resolves.toBe(true);
      expect(connections.areConnected).not.toHaveBeenCalled();
    });

    it("allows a direct channel while the two are still connected", async () => {
      query.getDirectCounterpartId.mockResolvedValue("u2");
      connections.areConnected.mockResolvedValue(true);

      await expect(service.canMessage("u1", "c1")).resolves.toBe(true);
      expect(connections.areConnected).toHaveBeenCalledWith("u1", "u2");
    });

    it("closes a direct channel once the contact has been removed", async () => {
      query.getDirectCounterpartId.mockResolvedValue("u2");
      connections.areConnected.mockResolvedValue(false);

      await expect(service.canMessage("u1", "c1")).resolves.toBe(false);
    });
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
