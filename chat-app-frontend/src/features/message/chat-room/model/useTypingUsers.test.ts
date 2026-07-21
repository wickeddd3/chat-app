import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import type { InboxChannel } from "@/entities/channel";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-user" } }),
}));

vi.mock("@/entities/channel", () => ({
  useChannel: vi.fn(),
}));

import { useChannel } from "@/entities/channel";
import { formatTypingLabel, useTypingUsers } from "./useTypingUsers";

const mockedUseChannel = vi.mocked(useChannel);

const member = (id: string, name: string) => ({
  id: `membership-${id}`,
  role: "MEMBER",
  user: { id, name, image: null, username: name.toLowerCase() },
});

describe("formatTypingLabel", () => {
  it("returns an empty string with nobody typing", () => {
    expect(formatTypingLabel([])).toBe("");
  });

  it("names a single typist", () => {
    expect(formatTypingLabel(["Jane"])).toBe("Jane is typing");
  });

  it("names both typists in a pair", () => {
    expect(formatTypingLabel(["Jane", "John"])).toBe(
      "Jane and John are typing",
    );
  });

  it("collapses a crowd behind the first name", () => {
    expect(formatTypingLabel(["Jane", "John", "Jack", "Jill"])).toBe(
      "Jane and 3 others are typing",
    );
  });
});

describe("useTypingUsers", () => {
  const queryKeys = createQueryKeys("auth-user");

  beforeEach(() => {
    mockedUseChannel.mockReturnValue({
      channel: {
        channelMembers: [member("auth-user", "Me"), member("user-2", "Jane")],
      } as InboxChannel,
      isLoading: false,
      error: null,
    });
  });

  it("reports nobody typing on an untouched cache", () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useTypingUsers("channel-1"), {
      wrapper: Wrapper,
    });

    expect(result.current).toEqual({ isTyping: false, label: "" });
  });

  it("resolves a typing id to the member's display name", async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();

    const { result } = renderHook(() => useTypingUsers("channel-1"), {
      wrapper: Wrapper,
    });

    queryClient.setQueryData(queryKeys.messages.typing("channel-1"), [
      "user-2",
    ]);

    await waitFor(() =>
      expect(result.current).toEqual({
        isTyping: true,
        label: "Jane is typing",
      }),
    );
  });

  it("falls back to a generic name for an unloaded member", async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();

    const { result } = renderHook(() => useTypingUsers("channel-1"), {
      wrapper: Wrapper,
    });

    queryClient.setQueryData(queryKeys.messages.typing("channel-1"), ["ghost"]);

    await waitFor(() => expect(result.current.label).toBe("Someone is typing"));
  });

  it("ignores the authenticated user's own id", async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();

    const { result } = renderHook(() => useTypingUsers("channel-1"), {
      wrapper: Wrapper,
    });

    // Paired with a real typist, so the assertion can't pass on the
    // indistinguishable "nothing happened yet" state.
    queryClient.setQueryData(queryKeys.messages.typing("channel-1"), [
      "auth-user",
      "user-2",
    ]);

    await waitFor(() =>
      expect(result.current).toEqual({
        isTyping: true,
        label: "Jane is typing",
      }),
    );
  });
});
