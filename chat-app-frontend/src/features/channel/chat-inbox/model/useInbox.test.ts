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
  return { channels, hasMore: !!nextCursor, nextCursor };
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
});
