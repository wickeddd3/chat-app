import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { usePresenceMap } from "./usePresenceMap";
import { getPresenceMapApi } from "../api/presence.api";

vi.mock("../api/presence.api", () => ({
  getPresenceMapApi: vi.fn(),
}));

const mockedGetPresenceMapApi = vi.mocked(getPresenceMapApi);

describe("usePresenceMap", () => {
  it("returns an empty map while loading, with no authId", () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => usePresenceMap(undefined), {
      wrapper: Wrapper,
    });

    expect(result.current.presenceMap).toEqual({});
  });

  it("does not fetch when authId is undefined", () => {
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => usePresenceMap(undefined), { wrapper: Wrapper });

    expect(mockedGetPresenceMapApi).not.toHaveBeenCalled();
  });

  it("fetches the global presence map once authId is provided", async () => {
    mockedGetPresenceMapApi.mockResolvedValue({
      "user-1": { status: "online", lastSeen: null },
      "user-2": { status: "offline", lastSeen: "2026-07-23T10:00:00.000Z" },
    });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => usePresenceMap("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current.presenceMap).toEqual({
        "user-1": { status: "online", lastSeen: null },
        "user-2": { status: "offline", lastSeen: "2026-07-23T10:00:00.000Z" },
      }),
    );
    expect(mockedGetPresenceMapApi).toHaveBeenCalledWith({
      params: { channelId: null },
    });
  });

  it("scopes the request to a channel when channelId is provided", async () => {
    mockedGetPresenceMapApi.mockResolvedValue({
      "user-1": { status: "online", lastSeen: null },
    });
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => usePresenceMap("auth-user", "channel-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(mockedGetPresenceMapApi).toHaveBeenCalledWith({
        params: { channelId: "channel-1" },
      }),
    );
  });
});
