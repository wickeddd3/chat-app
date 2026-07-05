import { TYPES } from "@/config/types";
import { NotificationsService } from "@/modules/notification/notifications.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("NotificationsService (DI container + mocked repository)", () => {
  let repo: { getByUserId: jest.Mock; markAsRead: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    repo = { getByUserId: jest.fn(), markAsRead: jest.fn() };
    const container = buildTestContainer([[TYPES.NotificationsRepository, repo]]);
    container.bind<NotificationsService>(TYPES.NotificationsService).to(NotificationsService);
    service = container.get<NotificationsService>(TYPES.NotificationsService);
  });

  it("forwards isRead to the repository only when it is a boolean", async () => {
    repo.getByUserId.mockResolvedValue({ notifications: [], hasMore: false, nextCursor: null });

    await service.getByUserId({ userId: "u1" });
    expect(repo.getByUserId).toHaveBeenCalledWith({ userId: "u1", limit: 20, cursor: undefined });

    await service.getByUserId({ userId: "u1", isRead: false, limit: 5, cursor: "c" });
    expect(repo.getByUserId).toHaveBeenCalledWith({ userId: "u1", isRead: false, limit: 5, cursor: "c" });
  });

  it("markAsRead delegates to the repository", async () => {
    repo.markAsRead.mockResolvedValue({ count: 2 });

    await expect(service.markAsRead({ userId: "u1", notificationIds: ["a", "b"] })).resolves.toEqual({ count: 2 });
    expect(repo.markAsRead).toHaveBeenCalledWith({ userId: "u1", notificationIds: ["a", "b"] });
  });

  it("wraps a repository failure in a 500 HttpException preserving the cause", async () => {
    const underlying = new Error("db down");
    repo.markAsRead.mockRejectedValue(underlying);

    await expect(service.markAsRead({ userId: "u1", notificationIds: ["a"] })).rejects.toMatchObject({
      statusCode: 500,
      cause: underlying,
    });
  });
});
