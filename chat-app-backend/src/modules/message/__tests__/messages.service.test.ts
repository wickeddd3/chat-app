import { TYPES } from "@/config/types";
import { MessagesService } from "@/modules/message/messages.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

// The service transitively pulls in the repository (decorator metadata references
// PrismaClient) and redis via other imports — stub the heavy infra modules.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("MessagesService (DI container + mocked repository)", () => {
  let repo: { create: jest.Mock; getMessages: jest.Mock; getUnreadMessages: jest.Mock };
  let service: MessagesService;

  beforeEach(() => {
    repo = { create: jest.fn(), getMessages: jest.fn(), getUnreadMessages: jest.fn() };
    const container = buildTestContainer([[TYPES.MessagesRepository, repo]]);
    container.bind<MessagesService>(TYPES.MessagesService).to(MessagesService);
    service = container.get<MessagesService>(TYPES.MessagesService);
  });

  it("saveMessage delegates to the repository and returns its result", async () => {
    const saved = { id: "m1" };
    repo.create.mockResolvedValue(saved);

    const data = { content: "hi", channelId: "c1", authorId: "u1" };
    await expect(service.saveMessage(data)).resolves.toBe(saved);
    expect(repo.create).toHaveBeenCalledWith(data);
  });

  it("getMessages forwards the cursor only when provided", async () => {
    repo.getMessages.mockResolvedValue({ messages: [], hasMore: false, nextCursor: null });

    await service.getMessages({ channelId: "c1" });
    expect(repo.getMessages).toHaveBeenCalledWith({ channelId: "c1", limit: 20 });

    await service.getMessages({ channelId: "c1", cursor: "abc", limit: 5 });
    expect(repo.getMessages).toHaveBeenCalledWith({ channelId: "c1", limit: 5, cursor: "abc" });
  });

  it("wraps a repository failure in a 500 HttpException preserving the cause", async () => {
    const underlying = new Error("db down");
    repo.getMessages.mockRejectedValue(underlying);

    await expect(service.getMessages({ channelId: "c1" })).rejects.toMatchObject({
      statusCode: 500,
      message: "Failed to retrieve messages.",
      cause: underlying,
    });
  });

  it("getUnreadMessages delegates with channel + user scope", async () => {
    repo.getUnreadMessages.mockResolvedValue([{ id: "m1" }]);

    await expect(service.getUnreadMessages("c1", "u1")).resolves.toEqual([{ id: "m1" }]);
    expect(repo.getUnreadMessages).toHaveBeenCalledWith("c1", "u1");
  });
});
