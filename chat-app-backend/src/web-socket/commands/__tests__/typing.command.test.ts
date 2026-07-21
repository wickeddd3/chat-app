import type { Socket } from "socket.io";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

import { TypingCommand } from "@/web-socket/commands/typing.command";
import type { ChannelsService } from "@/modules/channel/channels.service";
import type { BroadcasterService } from "@/services/broadcaster.service";
import type { PresenceService } from "@/services/presence.service";

describe("TypingCommand", () => {
  let channelsService: { getMemberIds: jest.Mock };
  let broadcaster: { emitToUser: jest.Mock };
  let presenceService: { getChannelMembersLookup: jest.Mock; setChannelMembersLookup: jest.Mock };
  let socket: { emit: jest.Mock };
  let command: TypingCommand;

  beforeEach(() => {
    channelsService = { getMemberIds: jest.fn() };
    broadcaster = { emitToUser: jest.fn().mockResolvedValue(undefined) };
    presenceService = {
      getChannelMembersLookup: jest.fn(),
      setChannelMembersLookup: jest.fn().mockResolvedValue(undefined),
    };
    socket = { emit: jest.fn() };

    command = new TypingCommand(
      channelsService as unknown as ChannelsService,
      broadcaster as unknown as BroadcasterService,
      presenceService as unknown as PresenceService,
    );
  });

  it("relays the signal to every member except the typist", async () => {
    presenceService.getChannelMembersLookup.mockResolvedValue(["u1", "u2", "u3"]);

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1", isTyping: true });

    expect(broadcaster.emitToUser).toHaveBeenCalledTimes(2);
    const payload = { channelId: "c1", userId: "u1", isTyping: true };
    expect(broadcaster.emitToUser).toHaveBeenCalledWith("u2", "message:typing_status", payload);
    expect(broadcaster.emitToUser).toHaveBeenCalledWith("u3", "message:typing_status", payload);
    expect(channelsService.getMemberIds).not.toHaveBeenCalled();
  });

  it("relays the stop signal the same way", async () => {
    presenceService.getChannelMembersLookup.mockResolvedValue(["u1", "u2"]);

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1", isTyping: false });

    expect(broadcaster.emitToUser).toHaveBeenCalledWith("u2", "message:typing_status", {
      channelId: "c1",
      userId: "u1",
      isTyping: false,
    });
  });

  it("rebuilds and re-warms the roster on a cold cache", async () => {
    presenceService.getChannelMembersLookup.mockResolvedValue([]);
    channelsService.getMemberIds.mockResolvedValue(["u1", "u2"]);

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1", isTyping: true });

    expect(presenceService.setChannelMembersLookup).toHaveBeenCalledWith("c1", ["u1", "u2"]);
    expect(broadcaster.emitToUser).toHaveBeenCalledTimes(1);
    expect(broadcaster.emitToUser).toHaveBeenCalledWith("u2", "message:typing_status", expect.anything());
  });

  it("rejects a non-member and broadcasts nothing", async () => {
    presenceService.getChannelMembersLookup.mockResolvedValue(["u2", "u3"]);

    await command.execute(socket as unknown as Socket, "outsider", { channelId: "c1", isTyping: true });

    expect(socket.emit).toHaveBeenCalledWith("error", expect.objectContaining({ code: "FORBIDDEN" }));
    expect(broadcaster.emitToUser).not.toHaveBeenCalled();
  });

  it("rejects a cold-cache lookup that returns no roster (not a member)", async () => {
    presenceService.getChannelMembersLookup.mockResolvedValue([]);
    channelsService.getMemberIds.mockResolvedValue([]);

    await command.execute(socket as unknown as Socket, "outsider", { channelId: "c1", isTyping: true });

    expect(presenceService.setChannelMembersLookup).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("error", expect.objectContaining({ code: "FORBIDDEN" }));
    expect(broadcaster.emitToUser).not.toHaveBeenCalled();
  });
});
