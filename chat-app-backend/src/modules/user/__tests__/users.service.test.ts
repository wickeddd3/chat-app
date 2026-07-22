import { TYPES } from "@/config/types";
import { UsersService } from "@/modules/user/users.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("UsersService (DI container + mocked queries)", () => {
  let usersQuery: { search: jest.Mock; getByUsername: jest.Mock };
  let connectionsQuery: { getContactIds: jest.Mock; getContactsOfContacts: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    usersQuery = { search: jest.fn().mockResolvedValue([]), getByUsername: jest.fn() };
    connectionsQuery = {
      getContactIds: jest.fn().mockResolvedValue([]),
      getContactsOfContacts: jest.fn().mockResolvedValue([]),
    };
    const container = buildTestContainer([
      [TYPES.UsersQuery, usersQuery],
      [TYPES.ConnectionsQuery, connectionsQuery],
    ]);
    container.bind<UsersService>(TYPES.UsersService).to(UsersService);
    service = container.get<UsersService>(TYPES.UsersService);
  });

  describe("getSuggestedUsers", () => {
    it("computes the friend-of-a-friend graph only on the initial (unsearched) load", async () => {
      connectionsQuery.getContactIds.mockResolvedValue(["a"]);
      connectionsQuery.getContactsOfContacts.mockResolvedValue([{ senderId: "a", receiverId: "fof" }]);
      usersQuery.search.mockResolvedValue([
        { id: "fof", name: "FoF", username: "fof", image: null, sentConnections: [], receivedConnections: [] },
      ]);

      const result = await service.getSuggestedUsers({ authUserId: "me" });

      expect(connectionsQuery.getContactsOfContacts).toHaveBeenCalledWith("me", ["a"]);
      expect(usersQuery.search).toHaveBeenCalledWith({ userId: "me", limit: 20, query: "" });
      // The candidate that is a friend-of-a-friend gets a non-zero mutual count.
      expect(result.find((u) => u.id === "fof")?.mutualConnectionsCount).toBeGreaterThan(0);
    });

    it("skips the graph computation entirely when a search query is present", async () => {
      await service.getSuggestedUsers({ authUserId: "me", query: "jane" });

      expect(connectionsQuery.getContactIds).not.toHaveBeenCalled();
      expect(connectionsQuery.getContactsOfContacts).not.toHaveBeenCalled();
      expect(usersQuery.search).toHaveBeenCalledWith({ userId: "me", limit: 20, query: "jane" });
    });

    it("does not fetch second-degree edges when the user has no contacts", async () => {
      connectionsQuery.getContactIds.mockResolvedValue([]);

      await service.getSuggestedUsers({ authUserId: "me" });

      expect(connectionsQuery.getContactsOfContacts).not.toHaveBeenCalled();
    });

    it("propagates a query failure unchanged rather than masking it as a 500", async () => {
      const underlying = new Error("db down");
      usersQuery.search.mockRejectedValue(underlying);

      await expect(service.getSuggestedUsers({ authUserId: "me", query: "x" })).rejects.toBe(underlying);
    });
  });

  it("getUserByUsername delegates to the query", async () => {
    const profile = { id: "u1", name: "U", username: "u", image: null };
    usersQuery.getByUsername.mockResolvedValue(profile);

    await expect(service.getUserByUsername("u")).resolves.toBe(profile);
    expect(usersQuery.getByUsername).toHaveBeenCalledWith("u");
  });
});
