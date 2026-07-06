import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleIncomingMessage } from "./message-receive.handler";
import { setActiveChannel } from "@/shared/utils/active-channel";
import type { InboxChannel } from "@/entities/channel";
import type { Message } from "@/entities/message";

vi.mock("@/shared/lib/socket-io.client", () => ({
  webSocketClient: { emit: vi.fn() },
}));

import { webSocketClient } from "@/shared/lib/socket-io.client";

const emitSpy = vi.mocked(webSocketClient).emit;

describe("handleIncomingMessage", () => {
  const queryKeys = createQueryKeys("auth-user");

  const basePayload = {
    channelPayload: {
      channelId: "channel-1",
      lastMessage: { content: "hey", createdAt: "2026-01-01T00:00:00.000Z" },
    },
    messagePayload: {
      id: "message-1",
      author: { id: "user-2", name: "Jane", image: null },
      authorId: "user-2",
      channelId: "channel-1",
      parentId: "",
      clientId: "client-1",
      content: "hey",
      createdAt: "2026-01-01T00:00:00.000Z",
    } as Message,
  };

  beforeEach(() => {
    emitSpy.mockClear();
    setActiveChannel(null);
  });

  afterEach(() => {
    setActiveChannel(null);
  });

  it("bumps unread count and sets the preview on the matching inbox channel", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.inbox.list(""), {
      pages: [{ channels: [{ id: "channel-1", unreadCount: 1 }] }],
    });
    queryClient.setQueryData(queryKeys.messages.timeline("channel-1"), {
      pages: [{ messages: [] }],
    });

    handleIncomingMessage(queryClient, queryKeys, basePayload, "auth-user");

    const inbox = queryClient.getQueryData<{
      pages: { channels: InboxChannel[] }[];
    }>(queryKeys.inbox.list(""));
    expect(inbox?.pages[0]?.channels[0]).toMatchObject({
      id: "channel-1",
      unreadCount: 2,
      lastMessage: basePayload.channelPayload.lastMessage,
    });
  });

  it("does not crash and triggers a refetch when the inbox cache is empty", () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    expect(() =>
      handleIncomingMessage(queryClient, queryKeys, basePayload, "auth-user"),
    ).not.toThrow();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.inbox.list(""),
    });
    expect(queryClient.getQueryData(queryKeys.inbox.list(""))).toBeUndefined();
  });

  it("resolves the optimistic message by clientId instead of duplicating it", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.messages.timeline("channel-1"), {
      pages: [
        {
          messages: [
            {
              clientId: "client-1",
              channelId: "channel-1",
              content: "hey",
              createdAt: "2026-01-01T00:00:00.000Z",
              isSending: true,
            },
          ],
        },
      ],
    });

    handleIncomingMessage(queryClient, queryKeys, basePayload, "auth-user");

    const timeline = queryClient.getQueryData<{
      pages: { messages: Message[] }[];
    }>(queryKeys.messages.timeline("channel-1"));
    expect(timeline?.pages[0]?.messages).toHaveLength(1);
    expect(timeline?.pages[0]?.messages[0]).toMatchObject({
      clientId: "client-1",
      isSending: false,
    });
  });

  it("appends a message from another client to the latest page", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.messages.timeline("channel-1"), {
      pages: [{ messages: [] }],
    });

    handleIncomingMessage(queryClient, queryKeys, basePayload, "auth-user");

    const timeline = queryClient.getQueryData<{
      pages: { messages: Message[] }[];
    }>(queryKeys.messages.timeline("channel-1"));
    expect(timeline?.pages[0]?.messages).toHaveLength(1);
    expect(timeline?.pages[0]?.messages[0]?.clientId).toBe("client-1");
  });

  it("increments the dashboard unread message count", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.dashboard.badges(), {
      unreadMessagesCount: 2,
    });

    handleIncomingMessage(queryClient, queryKeys, basePayload, "auth-user");

    expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
      unreadMessagesCount: 3,
    });
  });

  it("does not count your own echoed message as unread", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.inbox.list(""), {
      pages: [{ channels: [{ id: "channel-1", unreadCount: 1 }] }],
    });
    queryClient.setQueryData(queryKeys.dashboard.badges(), {
      unreadMessagesCount: 2,
    });

    // authId matches the message author => own message
    handleIncomingMessage(queryClient, queryKeys, basePayload, "user-2");

    const inbox = queryClient.getQueryData<{
      pages: { channels: InboxChannel[] }[];
    }>(queryKeys.inbox.list(""));
    // preview refreshed, unread untouched
    expect(inbox?.pages[0]?.channels[0]).toMatchObject({
      unreadCount: 1,
      lastMessage: basePayload.channelPayload.lastMessage,
    });
    expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
      unreadMessagesCount: 2,
    });
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("auto-marks a message read when it arrives in the channel you're viewing", () => {
    setActiveChannel("channel-1");
    const queryClient = new QueryClient();

    handleIncomingMessage(queryClient, queryKeys, basePayload, "auth-user");

    expect(emitSpy).toHaveBeenCalledWith("message:mark_as_read", {
      channelId: "channel-1",
    });
  });

  it("does not auto-mark read for a channel you're not viewing", () => {
    setActiveChannel("some-other-channel");
    const queryClient = new QueryClient();

    handleIncomingMessage(queryClient, queryKeys, basePayload, "auth-user");

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
