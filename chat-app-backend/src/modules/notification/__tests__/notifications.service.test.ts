import { TYPES } from "@/config/types";
import { NotificationsService } from "@/modules/notification/notifications.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("NotificationsService (DI container + mocked persistence)", () => {
  let query: { getByUserId: jest.Mock };
  let repo: { markAsRead: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    query = { getByUserId: jest.fn() };
    repo = { markAsRead: jest.fn() };
    const container = buildTestContainer([
      [TYPES.NotificationsQuery, query],
      [TYPES.NotificationsRepository, repo],
    ]);
    container.bind<NotificationsService>(TYPES.NotificationsService).to(NotificationsService);
    service = container.get<NotificationsService>(TYPES.NotificationsService);
  });

  it("getByUserId delegates the feed read to the query side unchanged", async () => {
    const page = { notifications: [], hasMore: false, nextCursor: null, total: 0 };
    query.getByUserId.mockResolvedValue(page);

    await expect(service.getByUserId({ userId: "u1", isRead: false, limit: 5, cursor: "c" })).resolves.toBe(page);
    expect(query.getByUserId).toHaveBeenCalledWith({ userId: "u1", isRead: false, limit: 5, cursor: "c" });
  });

  it("markAsRead delegates to the write repository", async () => {
    repo.markAsRead.mockResolvedValue({ count: 2 });

    await expect(service.markAsRead({ userId: "u1", notificationIds: ["a", "b"] })).resolves.toEqual({ count: 2 });
    expect(repo.markAsRead).toHaveBeenCalledWith({ userId: "u1", notificationIds: ["a", "b"] });
  });

  it("propagates a persistence failure unchanged rather than masking it as a 500", async () => {
    const underlying = new Error("db down");
    repo.markAsRead.mockRejectedValue(underlying);

    await expect(service.markAsRead({ userId: "u1", notificationIds: ["a"] })).rejects.toBe(underlying);
  });
});
