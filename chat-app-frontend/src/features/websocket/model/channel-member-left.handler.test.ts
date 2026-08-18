import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleChannelMemberLeft } from "./channel-member-left.handler";
import type { Message, PaginatedMessage } from "@/entities/message";
import type { InboxChannel } from "@/entities/channel";

describe("handleChannelMemberLeft", () => {
  const queryKeys = createQueryKeys("auth-user");

  const systemMessage = {
    id: "sys-1",
    type: "SYSTEM",
    content: "Ada left the group",
    author: { id: "ada", name: "Ada", image: null },
    createdAt: "2026-07-21T10:00:00.000Z",
  } as Message;

  const payload = {
    channelId: "c1",
    userId: "ada",
    promotedAdminId: null,
    systemMessage,
  };

  function seedChannel(queryClient: QueryClient) {
    queryClient.setQueryData<InboxChannel>(queryKeys.channel.details("c1"), {
      id: "c1",
      type: "GROUP",
      channelMembers: [
        {
          id: "cm-1",
          role: "ADMIN",
          user: { id: "ada", name: "Ada", username: "ada", image: null },
        },
        {
          id: "cm-2",
          role: "MEMBER",
          user: { id: "bob", name: "Bob", username: "bob", image: null },
        },
      ],
    } as InboxChannel);
  }

  function seedTimeline(queryClient: QueryClient, messages: Message[]) {
    queryClient.setQueryData<InfiniteData<PaginatedMessage>>(
      queryKeys.messages.timeline("c1"),
      {
        pages: [{ messages, hasMore: false, nextCursor: null }],
        pageParams: [null],
      },
    );
  }

  const readTimeline = (queryClient: QueryClient) =>
    queryClient.getQueryData<InfiniteData<PaginatedMessage>>(
      queryKeys.messages.timeline("c1"),
    );

  const readChannel = (queryClient: QueryClient) =>
    queryClient.getQueryData<InboxChannel>(queryKeys.channel.details("c1"));

  it("drops the leaver from the cached roster", () => {
    const queryClient = new QueryClient();
    seedChannel(queryClient);

    handleChannelMemberLeft(queryClient, queryKeys, payload);

    expect(
      readChannel(queryClient)?.channelMembers.map((m) => m.user.id),
    ).toEqual(["bob"]);
  });

  it("reflects an admin promotion so the edit control appears for the successor", () => {
    const queryClient = new QueryClient();
    seedChannel(queryClient);

    handleChannelMemberLeft(queryClient, queryKeys, {
      ...payload,
      promotedAdminId: "bob",
    });

    expect(readChannel(queryClient)?.channelMembers[0]?.role).toBe("ADMIN");
  });

  it("appends the system line to the newest page, where a new message lands", () => {
    const queryClient = new QueryClient();
    const existing = { id: "m1", content: "hi" } as Message;
    seedTimeline(queryClient, [existing]);

    handleChannelMemberLeft(queryClient, queryKeys, payload);

    expect(
      readTimeline(queryClient)?.pages[0]?.messages.map((m) => m.id),
    ).toEqual(["m1", "sys-1"]);
  });

  it("is idempotent — a duplicate event cannot post the line twice", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, []);

    handleChannelMemberLeft(queryClient, queryKeys, payload);
    handleChannelMemberLeft(queryClient, queryKeys, payload);

    expect(readTimeline(queryClient)?.pages[0]?.messages).toHaveLength(1);
  });

  it("skips the timeline when the channel was deleted and there is no line", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, []);

    handleChannelMemberLeft(queryClient, queryKeys, {
      ...payload,
      systemMessage: null,
    });

    expect(readTimeline(queryClient)?.pages[0]?.messages).toHaveLength(0);
  });
});
