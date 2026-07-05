import type { Socket } from "socket.io";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

import { ReadMessageCommand } from "@/web-socket/commands/read-message.command";
import type { MessagesService } from "@/modules/message/messages.service";
import type { MessageReceiptsService } from "@/modules/message-receipt/message-receipts.service";
import type { ChannelsService } from "@/modules/channel/channels.service";
import type { BroadcasterService } from "@/services/broadcaster.service";

describe("ReadMessageCommand", () => {
  let messagesService: { getUnreadMessages: jest.Mock };
  let receiptsService: { createMessageReceipts: jest.Mock };
  let channelsService: { isMember: jest.Mock };
  let broadcaster: { emitToUser: jest.Mock };
  let socket: { emit: jest.Mock };
  let command: ReadMessageCommand;

  beforeEach(() => {
    messagesService = { getUnreadMessages: jest.fn() };
    receiptsService = { createMessageReceipts: jest.fn() };
    channelsService = { isMember: jest.fn() };
    broadcaster = { emitToUser: jest.fn().mockResolvedValue(undefined) };
    socket = { emit: jest.fn() };

    command = new ReadMessageCommand(
      messagesService as unknown as MessagesService,
      receiptsService as unknown as MessageReceiptsService,
      channelsService as unknown as ChannelsService,
      broadcaster as unknown as BroadcasterService,
    );
  });

  it("rejects a non-member and never touches receipts", async () => {
    channelsService.isMember.mockResolvedValue(false);

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1" });

    expect(socket.emit).toHaveBeenCalledWith("error", expect.objectContaining({ code: "FORBIDDEN" }));
    expect(messagesService.getUnreadMessages).not.toHaveBeenCalled();
    expect(receiptsService.createMessageReceipts).not.toHaveBeenCalled();
  });

  it("marks unread messages read for a member and emits the badge-clear event", async () => {
    channelsService.isMember.mockResolvedValue(true);
    messagesService.getUnreadMessages.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);
    receiptsService.createMessageReceipts.mockResolvedValue({ count: 2 });

    await command.execute(socket as unknown as Socket, "u1", { channelId: "c1" });

    expect(receiptsService.createMessageReceipts).toHaveBeenCalledWith("u1", ["m1", "m2"]);
    expect(broadcaster.emitToUser).toHaveBeenCalledWith("u1", "message:read", { channelId: "c1", readMessageCount: 2 });
  });
});
