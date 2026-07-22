import { TYPES } from "@/config/types";
import { MessagesService } from "@/modules/message/messages.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

// The service transitively pulls in the persistence classes (decorator metadata
// references PrismaClient) and redis via other imports — stub the heavy infra.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("MessagesService (DI container + mocked persistence)", () => {
  let repo: { create: jest.Mock };
  let query: { getMessages: jest.Mock; getUnreadMessages: jest.Mock };
  let service: MessagesService;

  beforeEach(() => {
    repo = { create: jest.fn() };
    query = { getMessages: jest.fn(), getUnreadMessages: jest.fn() };
    const container = buildTestContainer([
      [TYPES.MessagesRepository, repo],
      [TYPES.MessagesQuery, query],
    ]);
    container.bind<MessagesService>(TYPES.MessagesService).to(MessagesService);
    service = container.get<MessagesService>(TYPES.MessagesService);
  });

  it("saveMessage delegates to the write repository", async () => {
    const saved = { id: "m1" };
    repo.create.mockResolvedValue(saved);

    const data = { content: "hi", channelId: "c1", authorId: "u1" };
    await expect(service.saveMessage(data)).resolves.toBe(saved);
    expect(repo.create).toHaveBeenCalledWith(data);
  });

  it("getMessages delegates to the query side unchanged", async () => {
    const page = { messages: [], hasMore: false, nextCursor: null };
    query.getMessages.mockResolvedValue(page);

    await expect(service.getMessages({ channelId: "c1", cursor: "abc", limit: 5 })).resolves.toBe(page);
    expect(query.getMessages).toHaveBeenCalledWith({ channelId: "c1", cursor: "abc", limit: 5 });
  });

  it("propagates a persistence failure unchanged rather than masking it as a 500", async () => {
    const underlying = new Error("db down");
    query.getMessages.mockRejectedValue(underlying);

    await expect(service.getMessages({ channelId: "c1" })).rejects.toBe(underlying);
  });

  it("getUnreadMessages delegates with channel + user scope", async () => {
    query.getUnreadMessages.mockResolvedValue([{ id: "m1", authorId: "u2" }]);

    await expect(service.getUnreadMessages("c1", "u1")).resolves.toEqual([{ id: "m1", authorId: "u2" }]);
    expect(query.getUnreadMessages).toHaveBeenCalledWith("c1", "u1");
  });
});
