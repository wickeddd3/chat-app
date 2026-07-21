import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleReadReceipt } from "./message-read-receipt.handler";
import type { Message } from "@/entities/message";

describe("handleReadReceipt", () => {
  const queryKeys = createQueryKeys("auth-user");

  const message = (id: string, overrides: Partial<Message> = {}) =>
    ({ id, content: id, readCount: 0, ...overrides }) as Message;

  function seedTimeline(queryClient: QueryClient, pages: Message[][]) {
    queryClient.setQueryData(queryKeys.messages.timeline("channel-1"), {
      pages: pages.map((messages) => ({ messages })),
    });
  }

  const timelineOf = (queryClient: QueryClient) =>
    queryClient.getQueryData<{ pages: { messages: Message[] }[] }>(
      queryKeys.messages.timeline("channel-1"),
    );

  const receipt = (messageIds: string[]) => ({
    channelId: "channel-1",
    messageIds,
    readerId: "user-2",
  });

  it("marks the named messages as read", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, [[message("m1"), message("m2")]]);

    handleReadReceipt(queryClient, queryKeys, receipt(["m1"]));

    const [first, second] = timelineOf(queryClient)!.pages[0].messages;
    expect(first.readCount).toBe(1);
    expect(second.readCount).toBe(0);
  });

  it("reaches messages on any loaded page", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, [[message("m1")], [message("m2")]]);

    handleReadReceipt(queryClient, queryKeys, receipt(["m2"]));

    expect(timelineOf(queryClient)!.pages[1].messages[0].readCount).toBe(1);
  });

  it("keeps a higher tally rather than resetting it to one", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, [[message("m1", { readCount: 3 })]]);

    handleReadReceipt(queryClient, queryKeys, receipt(["m1"]));

    expect(timelineOf(queryClient)!.pages[0].messages[0].readCount).toBe(3);
  });

  it("treats a message with no tally as newly read", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, [[message("m1", { readCount: undefined })]]);

    handleReadReceipt(queryClient, queryKeys, receipt(["m1"]));

    expect(timelineOf(queryClient)!.pages[0].messages[0].readCount).toBe(1);
  });

  it("leaves the cache untouched when it holds none of the messages", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, [[message("m1")]]);
    const before = timelineOf(queryClient);

    handleReadReceipt(queryClient, queryKeys, receipt(["elsewhere"]));

    // Same reference: an unrelated receipt must not re-render the timeline.
    expect(timelineOf(queryClient)).toBe(before);
  });

  it("ignores an empty receipt", () => {
    const queryClient = new QueryClient();
    seedTimeline(queryClient, [[message("m1")]]);
    const before = timelineOf(queryClient);

    handleReadReceipt(queryClient, queryKeys, receipt([]));

    expect(timelineOf(queryClient)).toBe(before);
  });

  it("does nothing when the timeline has not been opened", () => {
    const queryClient = new QueryClient();

    expect(() =>
      handleReadReceipt(queryClient, queryKeys, receipt(["m1"])),
    ).not.toThrow();
    expect(timelineOf(queryClient)).toBeUndefined();
  });
});
