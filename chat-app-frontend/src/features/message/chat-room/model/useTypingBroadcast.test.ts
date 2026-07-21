import { act, renderHook } from "@testing-library/react";

vi.mock("@/shared/lib/socket-io.client", () => ({
  webSocketClient: { emit: vi.fn() },
}));

import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useTypingBroadcast } from "./useTypingBroadcast";

const emitSpy = vi.mocked(webSocketClient).emit;

const typingCalls = () =>
  emitSpy.mock.calls.filter(([event]) => event === "message:typing");

describe("useTypingBroadcast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces once for a burst of keystrokes", () => {
    const { result } = renderHook(() => useTypingBroadcast("channel-1"));

    act(() => {
      result.current.notifyTyping();
      result.current.notifyTyping();
      result.current.notifyTyping();
    });

    expect(typingCalls()).toEqual([
      ["message:typing", { channelId: "channel-1", isTyping: true }],
    ]);
  });

  it("re-announces while the user keeps typing past the refresh window", () => {
    const { result } = renderHook(() => useTypingBroadcast("channel-1"));

    act(() => result.current.notifyTyping());
    act(() => {
      vi.advanceTimersByTime(2000);
      result.current.notifyTyping();
    });

    expect(typingCalls()).toHaveLength(2);
    expect(typingCalls()[1]).toEqual([
      "message:typing",
      { channelId: "channel-1", isTyping: true },
    ]);
  });

  it("retracts after the idle window elapses", () => {
    const { result } = renderHook(() => useTypingBroadcast("channel-1"));

    act(() => result.current.notifyTyping());
    act(() => vi.advanceTimersByTime(3000));

    expect(typingCalls()[1]).toEqual([
      "message:typing",
      { channelId: "channel-1", isTyping: false },
    ]);
  });

  it("retracts explicitly only when a burst is in flight", () => {
    const { result } = renderHook(() => useTypingBroadcast("channel-1"));

    act(() => result.current.stopTyping());
    expect(typingCalls()).toHaveLength(0);

    act(() => result.current.notifyTyping());
    act(() => result.current.stopTyping());
    act(() => result.current.stopTyping());

    expect(typingCalls()).toHaveLength(2);
    expect(typingCalls()[1]?.[1]).toEqual({
      channelId: "channel-1",
      isTyping: false,
    });
  });

  it("does not fire a stale idle retraction after an explicit stop", () => {
    const { result } = renderHook(() => useTypingBroadcast("channel-1"));

    act(() => result.current.notifyTyping());
    act(() => result.current.stopTyping());
    act(() => vi.advanceTimersByTime(3000));

    expect(typingCalls()).toHaveLength(2);
  });

  it("retracts for the channel being left when it changes", () => {
    const { result, rerender } = renderHook(
      ({ channelId }) => useTypingBroadcast(channelId),
      { initialProps: { channelId: "channel-1" } },
    );

    act(() => result.current.notifyTyping());
    rerender({ channelId: "channel-2" });

    expect(typingCalls()[1]).toEqual([
      "message:typing",
      { channelId: "channel-1", isTyping: false },
    ]);
  });

  it("retracts on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useTypingBroadcast("channel-1"),
    );

    act(() => result.current.notifyTyping());
    unmount();

    expect(typingCalls()[1]).toEqual([
      "message:typing",
      { channelId: "channel-1", isTyping: false },
    ]);
  });
});
