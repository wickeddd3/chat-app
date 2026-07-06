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

const payload = { content: "hello", channelId: "c1", clientId: "tmp-1" };

function buildSavedMessage() {
  return {
    id: "m1",
    content: "hello",
    channelId: "c1",
    author: { id: "u1", name: "Alice", image: null },
    createdAt: new Date(),
  };
}

describe("SendMessageCommand", () => {
  let messagesService: { saveMessage: jest.Mock };
  let channelsService: { isMember: jest.Mock; updateChannel: jest.Mock; getMemberIds: jest.Mock };
  let broadcaster: { emitToUser: jest.Mock };
  let presence: { setChannelMembersLookup: jest.Mock; getChannelMembersLookup: jest.Mock };
  let socket: { emit: jest.Mock };
  let command: SendMessageCommand;

  beforeEach(() => {
    messagesService = { saveMessage: jest.fn().mockResolvedValue(buildSavedMessage()) };
    channelsService = {
      isMember: jest.fn(),
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
});
