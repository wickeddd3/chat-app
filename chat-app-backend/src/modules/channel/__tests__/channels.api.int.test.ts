import request from "supertest";
import { TYPES } from "@/config/types";

// Auth is verified via jose/JWKS — mock it so we control the caller's identity.
// Redis is mocked so importing the DI container never opens a real connection.
jest.mock("@/lib/jwt", () => ({ verifySupabaseToken: jest.fn() }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));

import { verifySupabaseToken } from "@/lib/jwt";
import { buildApiTestApp } from "@/test/helpers/app.helper";
import { addMember, createChannel, createUser } from "@/test/factories";

const mockVerify = verifySupabaseToken as jest.Mock;
const app = buildApiTestApp([TYPES.ChannelsRouter]);

describe("Channels API (HTTP integration: real app + DB, mocked auth)", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const res = await request(app).get("/channels");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 when the token fails verification", async () => {
    mockVerify.mockRejectedValueOnce(new Error("bad token"));
    const res = await request(app).get("/channels").set("Authorization", "Bearer invalid");
    expect(res.status).toBe(401);
  });

  it("returns 200 with the authenticated user's channels and pagination meta", async () => {
    const user = await createUser();
    const channel = await createChannel({ authorId: user.id, type: "GROUP", name: "My Group" });
    await addMember(channel.id, user.id);
    // A channel the user is NOT a member of must not appear.
    const stranger = await createUser();
    await createChannel({ authorId: stranger.id, type: "GROUP" }).then((c) => addMember(c.id, stranger.id));

    mockVerify.mockResolvedValue({ authId: user.id });
    const res = await request(app).get("/channels").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: expect.any(String) });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(channel.id);
    expect(res.body.meta).toMatchObject({ limit: 20, hasMore: false, nextCursor: null });
  });

  it("returns 400 when the channelId path param is not a UUID (validation)", async () => {
    mockVerify.mockResolvedValue({ authId: (await createUser()).id });
    const res = await request(app).get("/channels/not-a-uuid").set("Authorization", "Bearer valid");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
