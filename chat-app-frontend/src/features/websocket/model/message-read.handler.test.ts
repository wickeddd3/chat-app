import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleClearUnread } from "./message-read.handler";
import type { InboxChannel } from "@/entities/channel";

describe("handleClearUnread", () => {
  const queryKeys = createQueryKeys("auth-user");

  function seedInbox(queryClient: QueryClient, channels: Partial<InboxChannel>[]) {
    queryClient.setQueryData(queryKeys.inbox.list(""), {
      pages: [{ channels }],
    });
  }

  it("zeroes out the unread count for the matching channel", () => {
    const queryClient = new QueryClient();
    seedInbox(queryClient, [
      { id: "channel-1", unreadCount: 5 },
      { id: "channel-2", unreadCount: 2 },
    ]);

    handleClearUnread(queryClient, queryKeys, {
      channelId: "channel-1",
      readMessageCount: 5,
    });

    const inbox = queryClient.getQueryData<{
      pages: { channels: InboxChannel[] }[];
    }>(queryKeys.inbox.list(""));
    expect(inbox?.pages[0]?.channels).toEqual([
      { id: "channel-1", unreadCount: 0 },
      { id: "channel-2", unreadCount: 2 },
    ]);
  });

  it("decrements the dashboard unread badge by the read count", () => {
    const queryClient = new QueryClient();
    seedInbox(queryClient, [{ id: "channel-1", unreadCount: 3 }]);
    queryClient.setQueryData(queryKeys.dashboard.badges(), {
      unreadMessagesCount: 7,
    });

    handleClearUnread(queryClient, queryKeys, {
      channelId: "channel-1",
      readMessageCount: 3,
    });

    expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
      unreadMessagesCount: 4,
    });
  });

  it("does nothing when the inbox cache has not been populated yet", () => {
    const queryClient = new QueryClient();

    expect(() =>
      handleClearUnread(queryClient, queryKeys, {
        channelId: "channel-1",
        readMessageCount: 1,
      }),
    ).not.toThrow();
    expect(queryClient.getQueryData(queryKeys.inbox.list(""))).toBeUndefined();
  });
});
