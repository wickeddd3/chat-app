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
  let query: { getMessages: jest.Mock; getUnreadMessages: jest.Mock; getChannelIdOf: jest.Mock };
  let receipts: { createMessageReceipts: jest.Mock };
  let service: MessagesService;

  beforeEach(() => {
    repo = { create: jest.fn() };
    query = { getMessages: jest.fn(), getUnreadMessages: jest.fn(), getChannelIdOf: jest.fn() };
    receipts = { createMessageReceipts: jest.fn() };
    const container = buildTestContainer([
      [TYPES.MessagesRepository, repo],
      [TYPES.MessagesQuery, query],
      [TYPES.MessageReceiptsRepository, receipts],
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
    // Nothing to check when there is no quote — a plain send costs no extra read.
    expect(query.getChannelIdOf).not.toHaveBeenCalled();
  });

  it("saveMessage persists a reply whose target is in the same channel", async () => {
    const saved = { id: "m2" };
    repo.create.mockResolvedValue(saved);
    query.getChannelIdOf.mockResolvedValue("c1");

    const data = { content: "agreed", channelId: "c1", authorId: "u1", parentId: "m1" };
    await expect(service.saveMessage(data)).resolves.toBe(saved);
    expect(query.getChannelIdOf).toHaveBeenCalledWith("m1");
    expect(repo.create).toHaveBeenCalledWith(data);
  });

  it("saveMessage refuses to quote a message from another channel", async () => {
    // Otherwise a crafted parentId would leak another channel's content into
    // this one as a quote.
    query.getChannelIdOf.mockResolvedValue("c2");

    await expect(
      service.saveMessage({ content: "hi", channelId: "c1", authorId: "u1", parentId: "m1" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("saveMessage refuses to quote a message that no longer exists", async () => {
    query.getChannelIdOf.mockResolvedValue(null);

    await expect(
      service.saveMessage({ content: "hi", channelId: "c1", authorId: "u1", parentId: "gone" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repo.create).not.toHaveBeenCalled();
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

  it("recordReads delegates to the receipt repository (receipts are part of this module)", async () => {
    receipts.createMessageReceipts.mockResolvedValue({ count: 2 });

    await expect(service.recordReads("u1", ["m1", "m2"])).resolves.toEqual({ count: 2 });
    expect(receipts.createMessageReceipts).toHaveBeenCalledWith("u1", ["m1", "m2"]);
  });
});
