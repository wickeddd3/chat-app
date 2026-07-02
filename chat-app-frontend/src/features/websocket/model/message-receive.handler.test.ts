import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleIncomingMessage } from "./message-receive.handler";
import type { InboxChannel } from "@/entities/channel";
import type { Message } from "@/entities/message";

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
      channelId: 1,
      parentId: "",
      clientId: "client-1",
      content: "hey",
      createdAt: "2026-01-01T00:00:00.000Z",
    } as Message,
  };

  it("bumps unread count and sets the preview on the matching inbox channel", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.inbox.list(""), {
      pages: [{ channels: [{ id: "channel-1", unreadCount: 1 }] }],
    });
    queryClient.setQueryData(queryKeys.messages.timeline("channel-1"), {
      pages: [{ messages: [] }],
    });

    handleIncomingMessage(queryClient, queryKeys, basePayload);

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
      handleIncomingMessage(queryClient, queryKeys, basePayload),
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

    handleIncomingMessage(queryClient, queryKeys, basePayload);

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

    handleIncomingMessage(queryClient, queryKeys, basePayload);

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

    handleIncomingMessage(queryClient, queryKeys, basePayload);

    expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
      unreadMessagesCount: 3,
    });
  });
});
