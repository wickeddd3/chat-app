import { randomUUID } from "crypto";
import type { Socket } from "socket.io";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

import { SendMessageCommand } from "@/web-socket/commands/send-message.command";
import type { MessagesService } from "@/modules/message/messages.service";
import type { ChannelsService } from "@/modules/channel/channels.service";
import type { BroadcasterService } from "@/services/broadcaster.service";
import type { PresenceService } from "@/services/presence.service";
import { ValidationError } from "@/shared/errors/domain.error";

const payload = { content: "hello", channelId: "c1", clientId: "tmp-1" };

// Matches the prefix the command builds from SUPABASE_URL (set in test setup).
const IMAGE_URL_BASE = "https://test.supabase.co/storage/v1/object/public/message-images";

function buildSavedMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    content: "hello",
    channelId: "c1",
    author: { id: "u1", name: "Alice", image: null },
    createdAt: new Date(),
    parentId: null,
    parent: null,
    ...overrides,
  };
}

describe("SendMessageCommand", () => {
  let messagesService: { saveMessage: jest.Mock };
  let channelsService: {
    isMember: jest.Mock;
    canMessage: jest.Mock;
    updateChannel: jest.Mock;
    getMemberIds: jest.Mock;
  };
  let broadcaster: { emitToUser: jest.Mock };
  let presence: { setChannelMembersLookup: jest.Mock; getChannelMembersLookup: jest.Mock };
  let socket: { emit: jest.Mock };
  let command: SendMessageCommand;

  beforeEach(() => {
    messagesService = { saveMessage: jest.fn().mockResolvedValue(buildSavedMessage()) };
    channelsService = {
      isMember: jest.fn(),
      canMessage: jest.fn().mockResolvedValue(true),
      updateChannel: jest.fn().mockResolvedValue(undefined),
      getMemberIds: jest.fn(),
    };
    broadcaster = { emitToUser: jest.fn().mockResolvedValue(undefined) };
    presence = {
      setChannelMembersLookup: jest.fn().mockResolvedValue(undefined),
      getChannelMembersLookup: jest.fn(),
    };
    socket = { emit: jest.fn() };

    command = new SendMessageCommand(
      messagesService as unknown as MessagesService,
      channelsService as unknown as ChannelsService,
      broadcaster as unknown as BroadcasterService,
      presence as unknown as PresenceService,
    );
  });

  it("rejects a non-member with a FORBIDDEN error and never persists", async () => {
    channelsService.isMember.mockResolvedValue(false);

    await command.execute(socket as unknown as Socket, "u1", payload);

    expect(socket.emit).toHaveBeenCalledWith("error", expect.objectContaining({ code: "FORBIDDEN" }));
    expect(messagesService.saveMessage).not.toHaveBeenCalled();
    expect(broadcaster.emitToUser).not.toHaveBeenCalled();
  });

  it("rejects a removed contact with a FORBIDDEN error and never persists", async () => {
    // Membership survives the removal — the channel and its history are kept —
    // so only the connection check stands between them and a new message.
    channelsService.isMember.mockResolvedValue(true);
    channelsService.canMessage.mockResolvedValue(false);

    await command.execute(socket as unknown as Socket, "u1", payload);

    expect(socket.emit).toHaveBeenCalledWith("error", expect.objectContaining({ code: "FORBIDDEN" }));
    expect(messagesService.saveMessage).not.toHaveBeenCalled();
    expect(broadcaster.emitToUser).not.toHaveBeenCalled();
  });

  it("fans out to the cached member set on a cache hit (no DB fallback)", async () => {
    channelsService.isMember.mockResolvedValue(true);
    presence.getChannelMembersLookup.mockResolvedValue(["u1", "u2"]);

    await command.execute(socket as unknown as Socket, "u1", payload);

    expect(messagesService.saveMessage).toHaveBeenCalledTimes(1);
    expect(channelsService.getMemberIds).not.toHaveBeenCalled();
    expect(presence.setChannelMembersLookup).not.toHaveBeenCalled();
    expect(broadcaster.emitToUser).toHaveBeenCalledTimes(2);
  });

  it("falls back to the DB and re-warms the cache on a cache miss", async () => {
    channelsService.isMember.mockResolvedValue(true);
    presence.getChannelMembersLookup.mockResolvedValue([]); // cache miss
    channelsService.getMemberIds.mockResolvedValue(["u1", "u2", "u3"]);

    await command.execute(socket as unknown as Socket, "u1", payload);

    expect(channelsService.getMemberIds).toHaveBeenCalledWith("u1", "c1");
    expect(presence.setChannelMembersLookup).toHaveBeenCalledWith("c1", ["u1", "u2", "u3"]);
    expect(broadcaster.emitToUser).toHaveBeenCalledTimes(3);
  });

  it("validates its payload schema (content required, channelId a UUID)", () => {
    expect(command.schema.safeParse(payload).success).toBe(false); // c1 isn't a UUID
    expect(command.schema.safeParse({ content: "", channelId: randomUUID(), clientId: "x" }).success).toBe(false);
    expect(command.schema.safeParse({ content: "hi", channelId: randomUUID(), clientId: "x" }).success).toBe(true);
  });

  it("accepts a photo from our own storage bucket, with or without a caption", () => {
    const base = { channelId: randomUUID(), clientId: "x" };
    const imageUrl = `${IMAGE_URL_BASE}/c1/u1/123.webp`;

    expect(command.schema.safeParse({ ...base, content: "", imageUrl }).success).toBe(true);
    expect(command.schema.safeParse({ ...base, content: "look", imageUrl }).success).toBe(true);
    expect(
      command.schema.safeParse({ ...base, content: "", imageUrl, imageWidth: 800, imageHeight: 600 }).success,
    ).toBe(true);
  });

  it("refuses an image URL that is not ours", () => {
    // Otherwise a message could embed a third-party URL that every member's
    // client would fetch — a tracking pixel leaking their IP.
    const base = { channelId: randomUUID(), clientId: "x", content: "" };

    expect(command.schema.safeParse({ ...base, imageUrl: "https://evil.example/pixel.gif" }).success).toBe(false);
    // Right host, wrong bucket — the prefix pins both.
    expect(
      command.schema.safeParse({ ...base, imageUrl: `${IMAGE_URL_BASE.replace("message-images", "avatars")}/x.webp` })
        .success,
    ).toBe(false);
  });

  it("still refuses a message with neither text nor an image", () => {
    expect(command.schema.safeParse({ content: "   ", channelId: randomUUID(), clientId: "x" }).success).toBe(false);
  });

  it("accepts an optional parentId, but only as a UUID", () => {
    const base = { content: "hi", channelId: randomUUID(), clientId: "x" };

    expect(command.schema.safeParse({ ...base, parentId: randomUUID() }).success).toBe(true);
    expect(command.schema.safeParse({ ...base, parentId: "not-a-uuid" }).success).toBe(false);
  });

  it("persists a reply with its parent and broadcasts the quote with it", async () => {
    const parent = { id: "m0", content: "original", type: "USER", author: { id: "u2", name: "Bo", image: null } };
    channelsService.isMember.mockResolvedValue(true);
    presence.getChannelMembersLookup.mockResolvedValue(["u1", "u2"]);
    messagesService.saveMessage.mockResolvedValue(buildSavedMessage({ parentId: "m0", parent }));

    await command.execute(socket as unknown as Socket, "u1", { ...payload, parentId: "m0" });

    expect(messagesService.saveMessage).toHaveBeenCalledWith(expect.objectContaining({ parentId: "m0" }));
    expect(broadcaster.emitToUser).toHaveBeenCalledWith(
      "u1",
      "message:receive_message",
      expect.objectContaining({ messagePayload: expect.objectContaining({ parentId: "m0", parent }) }),
    );
  });

  it("sends parentId as null when the message is not a reply", async () => {
    channelsService.isMember.mockResolvedValue(true);
    presence.getChannelMembersLookup.mockResolvedValue(["u1"]);

    await command.execute(socket as unknown as Socket, "u1", payload);

    expect(messagesService.saveMessage).toHaveBeenCalledWith(expect.objectContaining({ parentId: null }));
  });

  it("reports a rejected reply target back on the socket instead of crashing the command", async () => {
    channelsService.isMember.mockResolvedValue(true);
    messagesService.saveMessage.mockRejectedValue(
      new ValidationError("You can only reply to a message in the same channel."),
    );

    await command.execute(socket as unknown as Socket, "u1", { ...payload, parentId: "m0" });

    expect(socket.emit).toHaveBeenCalledWith("error", expect.objectContaining({ code: "VALIDATION" }));
    expect(broadcaster.emitToUser).not.toHaveBeenCalled();
  });

  it("lets an unexpected failure bubble to the server's catch-all", async () => {
    channelsService.isMember.mockResolvedValue(true);
    messagesService.saveMessage.mockRejectedValue(new Error("db down"));

    await expect(command.execute(socket as unknown as Socket, "u1", payload)).rejects.toThrow("db down");
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
