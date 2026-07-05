import { randomUUID } from "crypto";
import request from "supertest";
import { TYPES } from "@/config/types";

jest.mock("@/lib/jwt", () => ({ verifySupabaseToken: jest.fn() }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));

import { verifySupabaseToken } from "@/lib/jwt";
import { buildApiTestApp } from "@/test/helpers/app.helper";
import { addMember, createChannel, createMessage, createUser } from "@/test/factories";

const mockVerify = verifySupabaseToken as jest.Mock;
const app = buildApiTestApp([TYPES.MessagesRouter]);

describe("Messages API (HTTP integration: membership authorization)", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/messages/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is NOT a member of the channel", async () => {
    const outsider = await createUser();
    const owner = await createUser();
    const channel = await createChannel({ authorId: owner.id, type: "GROUP" });
    await addMember(channel.id, owner.id);
    await createMessage({ channelId: channel.id, authorId: owner.id });

    mockVerify.mockResolvedValue({ authId: outsider.id });
    const res = await request(app).get(`/messages/${channel.id}`).set("Authorization", "Bearer valid");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 200 with the history when the caller IS a member", async () => {
    const member = await createUser();
    const channel = await createChannel({ authorId: member.id, type: "GROUP" });
    await addMember(channel.id, member.id);
    const msg = await createMessage({ channelId: channel.id, authorId: member.id, content: "hi team" });

    mockVerify.mockResolvedValue({ authId: member.id });
    const res = await request(app).get(`/messages/${channel.id}`).set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.data.map((m: { id: string }) => m.id)).toContain(msg.id);
  });

  it("returns 400 when channelId is not a UUID (validation runs before authz)", async () => {
    mockVerify.mockResolvedValue({ authId: (await createUser()).id });
    const res = await request(app).get("/messages/not-a-uuid").set("Authorization", "Bearer valid");
    expect(res.status).toBe(400);
  });
});
