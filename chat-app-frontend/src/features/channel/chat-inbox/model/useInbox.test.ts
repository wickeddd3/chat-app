import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useInbox } from "./useInbox";
import { getInboxApi } from "../api/channels.api";
import type { InboxChannel, PaginatedInboxChannel } from "@/entities/channel";

vi.mock("../api/channels.api", () => ({
  getInboxApi: vi.fn(),
}));

const mockedGetInboxApi = vi.mocked(getInboxApi);

function page(
  channels: InboxChannel[],
  nextCursor: string | null = null,
): PaginatedInboxChannel {
  return {
    channels,
    hasMore: !!nextCursor,
    nextCursor,
    total: channels.length,
  };
}

describe("useInbox", () => {
  it("fetches the inbox on mount with no query param when query is empty", async () => {
    mockedGetInboxApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useInbox("auth-user"), { wrapper: Wrapper });

    await waitFor(() =>
      expect(mockedGetInboxApi).toHaveBeenCalledWith({
        params: { cursor: null },
      }),
    );
  });

  it("returns the flattened inbox list once loaded", async () => {
    const channels = [{ id: "channel-1" } as InboxChannel];
    mockedGetInboxApi.mockResolvedValue(page(channels));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useInbox("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.inbox).toEqual(channels);
    expect(result.current.isEmpty).toBe(false);
  });

  it("reports isEmpty once loading finishes with no channels", async () => {
    mockedGetInboxApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useInbox("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEmpty).toBe(true);
  });

  it("passes a non-default filter through to the API and exposes the total", async () => {
    const channels = [{ id: "g-1" } as InboxChannel];
    mockedGetInboxApi.mockResolvedValue({
      channels,
      hasMore: false,
      nextCursor: null,
      total: 7,
    });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useInbox("auth-user", "", "groups"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(mockedGetInboxApi).toHaveBeenCalledWith({
        params: { cursor: null, filter: "groups" },
      }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // total reflects the full filtered set, independent of the loaded page size.
    expect(result.current.total).toBe(7);
  });
});
