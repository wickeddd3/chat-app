import request from "supertest";
import { TYPES } from "@/config/types";

jest.mock("@/lib/jwt", () => ({ verifySupabaseToken: jest.fn() }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));

import { verifySupabaseToken } from "@/lib/jwt";
import { prisma } from "@/test/helpers/db.helper";
import { buildApiTestApp } from "@/test/helpers/app.helper";
import { createNotification, createUser } from "@/test/factories";

const mockVerify = verifySupabaseToken as jest.Mock;
const app = buildApiTestApp([TYPES.NotificationsRouter]);

describe("Notifications API (HTTP integration: real app + DB, mocked auth)", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/notifications");
    expect(res.status).toBe(401);
  });

  it("returns 200 with the authenticated user's notifications", async () => {
    const user = await createUser();
    await createNotification({ userId: user.id, content: "You have a request" });
    await createNotification({ userId: (await createUser()).id }); // someone else's — must not leak

    mockVerify.mockResolvedValue({ authId: user.id });
    const res = await request(app).get("/notifications").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].content).toBe("You have a request");
  });

  it("POST /notifications/mark-as-read marks the given notifications read", async () => {
    const user = await createUser();
    const n1 = await createNotification({ userId: user.id, isRead: false });
    const n2 = await createNotification({ userId: user.id, isRead: false });

    mockVerify.mockResolvedValue({ authId: user.id });
    const res = await request(app)
      .post("/notifications/mark-as-read")
      .set("Authorization", "Bearer valid")
      .send({ notificationIds: [n1.id, n2.id] });

    expect(res.status).toBe(200);
    expect((await prisma.notification.findUniqueOrThrow({ where: { id: n1.id } })).isRead).toBe(true);
    expect((await prisma.notification.findUniqueOrThrow({ where: { id: n2.id } })).isRead).toBe(true);
  });

  it("returns 400 when mark-as-read is called with an empty id list (validation)", async () => {
    mockVerify.mockResolvedValue({ authId: (await createUser()).id });
    const res = await request(app)
      .post("/notifications/mark-as-read")
      .set("Authorization", "Bearer valid")
      .send({ notificationIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
