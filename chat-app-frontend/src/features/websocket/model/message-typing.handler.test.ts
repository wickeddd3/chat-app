import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import {
  handleTypingStatus,
  resetTypingExpiries,
  TYPING_TTL_MS,
} from "./message-typing.handler";

describe("handleTypingStatus", () => {
  const queryKeys = createQueryKeys("auth-user");

  const roster = (queryClient: QueryClient, channelId: string) =>
    queryClient.getQueryData<string[]>(queryKeys.messages.typing(channelId));

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetTypingExpiries();
    vi.useRealTimers();
  });

  it("adds a typist to the channel roster", () => {
    const queryClient = new QueryClient();

    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    });

    expect(roster(queryClient, "channel-1")).toEqual(["user-1"]);
  });

  it("keeps multiple typists without duplicating a repeated signal", () => {
    const queryClient = new QueryClient();

    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    });
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-2",
      isTyping: true,
    });
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    });

    expect(roster(queryClient, "channel-1")).toEqual(["user-1", "user-2"]);
  });

  it("removes only the typist that stopped", () => {
    const queryClient = new QueryClient();

    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    });
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-2",
      isTyping: true,
    });
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: false,
    });

    expect(roster(queryClient, "channel-1")).toEqual(["user-2"]);
  });

  it("scopes rosters per channel", () => {
    const queryClient = new QueryClient();

    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    });
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-2",
      userId: "user-1",
      isTyping: true,
    });
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: false,
    });

    expect(roster(queryClient, "channel-1")).toEqual([]);
    expect(roster(queryClient, "channel-2")).toEqual(["user-1"]);
  });

  it("evicts a typist whose stop signal never arrives", () => {
    const queryClient = new QueryClient();

    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    });

    vi.advanceTimersByTime(TYPING_TTL_MS - 1);
    expect(roster(queryClient, "channel-1")).toEqual(["user-1"]);

    vi.advanceTimersByTime(1);
    expect(roster(queryClient, "channel-1")).toEqual([]);
  });

  it("refreshes the expiry while the typist keeps announcing", () => {
    const queryClient = new QueryClient();
    const payload = {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    };

    handleTypingStatus(queryClient, queryKeys, payload);
    vi.advanceTimersByTime(TYPING_TTL_MS - 1000);
    handleTypingStatus(queryClient, queryKeys, payload);
    vi.advanceTimersByTime(TYPING_TTL_MS - 1000);

    expect(roster(queryClient, "channel-1")).toEqual(["user-1"]);
  });

  it("cancels the expiry of a typist that stopped, leaving other typists alone", () => {
    const queryClient = new QueryClient();

    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: true,
    });
    vi.advanceTimersByTime(1000);
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-1",
      isTyping: false,
    });
    handleTypingStatus(queryClient, queryKeys, {
      channelId: "channel-1",
      userId: "user-2",
      isTyping: true,
    });

    // Past the point user-1's expiry would have fired — user-2 must survive it.
    vi.advanceTimersByTime(TYPING_TTL_MS - 1000);
    expect(roster(queryClient, "channel-1")).toEqual(["user-2"]);

    vi.advanceTimersByTime(1000);
    expect(roster(queryClient, "channel-1")).toEqual([]);
  });
});
