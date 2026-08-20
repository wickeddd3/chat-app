import { act, renderHook } from "@testing-library/react";
import { useReplyTarget } from "./useReplyTarget";
import type { Message } from "@/entities/message";

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: "m-1",
    author: { id: "user-1", name: "Jane", image: null },
    content: "Hello there",
    createdAt: "2026-01-01T00:00:00.000Z",
    authorId: "user-1",
    channelId: "channel-1",
    ...overrides,
  };
}

describe("useReplyTarget", () => {
  it("stages the quote a reply will carry", () => {
    const { result } = renderHook(() => useReplyTarget("channel-1"));

    act(() => result.current.replyTo(message()));

    expect(result.current.replyTarget).toEqual({
      id: "m-1",
      content: "Hello there",
      author: { id: "user-1", name: "Jane", image: null },
    });
  });

  it("keeps the message kind, so a quoted system line still reads as one", () => {
    const { result } = renderHook(() => useReplyTarget("channel-1"));

    act(() => result.current.replyTo(message({ type: "SYSTEM" })));

    expect(result.current.replyTarget?.type).toBe("SYSTEM");
  });

  it("ignores a message that has not been stored yet", () => {
    // An optimistic message has no server id, so nothing could point at it.
    const { result } = renderHook(() => useReplyTarget("channel-1"));

    act(() =>
      result.current.replyTo({
        author: { id: "user-1" },
        content: "pending",
        createdAt: "2026-01-01T00:00:00.000Z",
        channelId: "channel-1",
        clientId: "tmp-1",
        isSending: true,
      }),
    );

    expect(result.current.replyTarget).toBeNull();
  });

  it("clears the draft on cancel", () => {
    const { result } = renderHook(() => useReplyTarget("channel-1"));

    act(() => result.current.replyTo(message()));
    act(() => result.current.cancelReply());

    expect(result.current.replyTarget).toBeNull();
  });

  it("drops the draft when the room switches channels", () => {
    // The route reuses one chat room across channels — a quote must never
    // follow the reader into a different conversation.
    const { result, rerender } = renderHook(
      ({ channelId }) => useReplyTarget(channelId),
      { initialProps: { channelId: "channel-1" } },
    );

    act(() => result.current.replyTo(message()));
    rerender({ channelId: "channel-2" });

    expect(result.current.replyTarget).toBeNull();
  });

  it("keeps the draft across re-renders of the same channel", () => {
    const { result, rerender } = renderHook(
      ({ channelId }) => useReplyTarget(channelId),
      { initialProps: { channelId: "channel-1" } },
    );

    act(() => result.current.replyTo(message()));
    rerender({ channelId: "channel-1" });

    expect(result.current.replyTarget?.id).toBe("m-1");
  });
});
