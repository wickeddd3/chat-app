import type { Socket } from "socket.io";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

import { ReadMessageCommand } from "@/web-socket/commands/read-message.command";
import type { MessagesService } from "@/modules/message/messages.service";
import type { ChannelsService } from "@/modules/channel/channels.service";
import type { BroadcasterService } from "@/services/broadcaster.service";

describe("ReadMessageCommand", () => {
  let messagesService: { getUnreadMessages: jest.Mock; recordReads: jest.Mock };
  let channelsService: { isMember: jest.Mock };
  let broadcaster: { emitToUser: jest.Mock };
  let socket: { emit: jest.Mock };
  let command: ReadMessageCommand;

  beforeEach(() => {
    messagesService = { getUnreadMessages: jest.fn(), recordReads: jest.fn() };
    channelsService = { isMember: jest.fn() };
    broadcaster = { emitToUser: jest.fn().mockResolvedValue(undefined) };
    socket = { emit: jest.fn() };

    command = new ReadMessageCommand(
      messagesService as unknown as MessagesService,
      channelsService as unknown as ChannelsService,
      broadcaster as unknown as BroadcasterService,
    );
  });

  it("rejects a non-member and never touches receipts", async () => {
    channelsService.isMember.mockResolvedValue(false);

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1" });

    expect(socket.emit).toHaveBeenCalledWith("error", expect.objectContaining({ code: "FORBIDDEN" }));
    expect(messagesService.getUnreadMessages).not.toHaveBeenCalled();
    expect(messagesService.recordReads).not.toHaveBeenCalled();
  });

  it("marks unread messages read for a member and emits the badge-clear event", async () => {
    channelsService.isMember.mockResolvedValue(true);
    messagesService.getUnreadMessages.mockResolvedValue([
      { id: "m1", authorId: "u2" },
      { id: "m2", authorId: "u2" },
    ]);
    messagesService.recordReads.mockResolvedValue({ count: 2 });

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1" });

    expect(messagesService.recordReads).toHaveBeenCalledWith("u1", ["m1", "m2"]);
    expect(broadcaster.emitToUser).toHaveBeenCalledWith("u1", "message:read", { channelId: "c1", readMessageCount: 2 });
  });

  it("reports the read back to the author of the messages", async () => {
    channelsService.isMember.mockResolvedValue(true);
    messagesService.getUnreadMessages.mockResolvedValue([
      { id: "m1", authorId: "u2" },
      { id: "m2", authorId: "u2" },
    ]);
    messagesService.recordReads.mockResolvedValue({ count: 2 });

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1" });

    expect(broadcaster.emitToUser).toHaveBeenCalledWith("u2", "message:read_receipt", {
      channelId: "c1",
      messageIds: ["m1", "m2"],
      readerId: "u1",
    });
  });

  it("tells each author only about their own messages", async () => {
    channelsService.isMember.mockResolvedValue(true);
    messagesService.getUnreadMessages.mockResolvedValue([
      { id: "m1", authorId: "u2" },
      { id: "m2", authorId: "u3" },
      { id: "m3", authorId: "u2" },
    ]);
    messagesService.recordReads.mockResolvedValue({ count: 3 });

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1" });

    expect(broadcaster.emitToUser).toHaveBeenCalledWith(
      "u2",
      "message:read_receipt",
      expect.objectContaining({ messageIds: ["m1", "m3"] }),
    );
    expect(broadcaster.emitToUser).toHaveBeenCalledWith(
      "u3",
      "message:read_receipt",
      expect.objectContaining({ messageIds: ["m2"] }),
    );
  });

  it("emits no receipt when there was nothing unread", async () => {
    channelsService.isMember.mockResolvedValue(true);
    messagesService.getUnreadMessages.mockResolvedValue([]);

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1" });

    expect(messagesService.recordReads).not.toHaveBeenCalled();
    expect(broadcaster.emitToUser).not.toHaveBeenCalledWith("u2", "message:read_receipt", expect.anything());
  });
});
