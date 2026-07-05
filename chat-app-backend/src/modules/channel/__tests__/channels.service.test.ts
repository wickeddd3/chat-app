import { TYPES } from "@/config/types";
import { ChannelsService } from "@/modules/channel/channels.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("ChannelsService (DI container + mocked repository)", () => {
  let repo: {
    getChannels: jest.Mock;
    findExistingDirectChannel: jest.Mock;
    createDirectChannel: jest.Mock;
    createGroupChannel: jest.Mock;
  };
  let service: ChannelsService;

  beforeEach(() => {
    repo = {
      getChannels: jest.fn(),
      findExistingDirectChannel: jest.fn(),
      createDirectChannel: jest.fn(),
      createGroupChannel: jest.fn(),
    };
    const container = buildTestContainer([[TYPES.ChannelsRepository, repo]]);
    container.bind<ChannelsService>(TYPES.ChannelsService).to(ChannelsService);
    service = container.get<ChannelsService>(TYPES.ChannelsService);
  });

  describe("findChannelOrCreate", () => {
    it("returns the existing direct channel without creating a new one", async () => {
      const existing = { id: "c1" };
      repo.findExistingDirectChannel.mockResolvedValue(existing);

      await expect(service.findChannelOrCreate("u1", "u2")).resolves.toBe(existing);
      expect(repo.createDirectChannel).not.toHaveBeenCalled();
    });

    it("creates a direct channel when none exists", async () => {
      const created = { id: "c2" };
      repo.findExistingDirectChannel.mockResolvedValue(null);
      repo.createDirectChannel.mockResolvedValue(created);

      await expect(service.findChannelOrCreate("u1", "u2")).resolves.toBe(created);
      expect(repo.createDirectChannel).toHaveBeenCalledWith("u1", "u2");
    });

    it("wraps a repository failure in a 500 HttpException", async () => {
      repo.findExistingDirectChannel.mockRejectedValue(new Error("boom"));

      await expect(service.findChannelOrCreate("u1", "u2")).rejects.toMatchObject({
        statusCode: 500,
        message: "Failed to retrieve or create channel",
      });
    });
  });

  it("getChannels passes defaults through to the repository", async () => {
    const payload = { channels: [], hasMore: false, nextCursor: null };
    repo.getChannels.mockResolvedValue(payload);

    await expect(service.getChannels({ authUserId: "u1" })).resolves.toBe(payload);
    expect(repo.getChannels).toHaveBeenCalledWith({ authUserId: "u1", limit: 20, cursor: "", query: "" });
  });
});
