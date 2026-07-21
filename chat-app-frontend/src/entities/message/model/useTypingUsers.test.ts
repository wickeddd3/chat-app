import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { formatTypingLabel, useTypingUsers } from "./useTypingUsers";

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

  const participants = [
    { id: "auth-user", name: "Me" },
    { id: "user-2", name: "Jane" },
  ];

  function setup() {
    const { Wrapper, queryClient } = createQueryClientWrapper();

    const { result } = renderHook(
      () =>
        useTypingUsers({
          channelId: "channel-1",
          authId: "auth-user",
          participants,
        }),
      { wrapper: Wrapper },
    );

    const setRoster = (ids: string[]) =>
      queryClient.setQueryData(queryKeys.messages.typing("channel-1"), ids);

    return { result, setRoster };
  }

  it("reports nobody typing on an untouched cache", () => {
    const { result } = setup();

    expect(result.current).toEqual({ isTyping: false, label: "" });
  });

  it("resolves a typing id to the participant's display name", async () => {
    const { result, setRoster } = setup();

    setRoster(["user-2"]);

    await waitFor(() =>
      expect(result.current).toEqual({
        isTyping: true,
        label: "Jane is typing",
      }),
    );
  });

  it("falls back to a generic name for an unknown participant", async () => {
    const { result, setRoster } = setup();

    setRoster(["ghost"]);

    await waitFor(() => expect(result.current.label).toBe("Someone is typing"));
  });

  it("ignores the authenticated user's own id", async () => {
    const { result, setRoster } = setup();

    // Paired with a real typist, so the assertion can't pass on the
    // indistinguishable "nothing happened yet" state.
    setRoster(["auth-user", "user-2"]);

    await waitFor(() =>
      expect(result.current).toEqual({
        isTyping: true,
        label: "Jane is typing",
      }),
    );
  });

  it("keeps each channel's roster separate", async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();

    const { result } = renderHook(
      () =>
        useTypingUsers({
          channelId: "channel-1",
          authId: "auth-user",
          participants,
        }),
      { wrapper: Wrapper },
    );

    queryClient.setQueryData(queryKeys.messages.typing("channel-2"), [
      "user-2",
    ]);

    await waitFor(() => expect(result.current.isTyping).toBe(false));
  });
});
