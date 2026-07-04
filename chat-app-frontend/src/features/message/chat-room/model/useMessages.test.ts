import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useMessages } from "./useMessages";
import { getMessagesApi } from "../api/messages.api";
import type { Message, PaginatedMessage } from "@/entities/message";

vi.mock("../api/messages.api", () => ({
  getMessagesApi: vi.fn(),
}));

const mockedGetMessagesApi = vi.mocked(getMessagesApi);

function message(id: string, clientId: string): Message {
  return {
    id,
    clientId,
    author: { id: "author-1", name: "Jane" },
    authorId: "author-1",
    channelId: "channel-1",
    parentId: "",
    content: `content-${id}`,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function page(messages: Message[], nextCursor: string | null = null): PaginatedMessage {
  return { messages, hasMore: !!nextCursor, nextCursor };
}

describe("useMessages", () => {
  it("does not fetch when channelId is empty", () => {
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useMessages("", "auth-user"), { wrapper: Wrapper });

    expect(mockedGetMessagesApi).not.toHaveBeenCalled();
  });

  it("fetches messages for the given channel once channelId is provided", async () => {
    mockedGetMessagesApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useMessages("channel-1", "auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(mockedGetMessagesApi).toHaveBeenCalledWith({
        channelId: "channel-1",
        params: { cursor: null },
      }),
    );
  });

  it("reverses page order so the oldest fetched page renders first", async () => {
    // The API returns pages newest-first (page 0 = latest batch fetched via cursor);
    // the hook must reverse *page* order, not message order within a page
    const newestPage = [message("3", "c3"), message("4", "c4")];
    const olderPage = [message("1", "c1"), message("2", "c2")];
    mockedGetMessagesApi
      .mockResolvedValueOnce(page(newestPage, "cursor-2"))
      .mockResolvedValueOnce(page(olderPage));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useMessages("channel-1", "auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    result.current.fetchNextPage();

    await waitFor(() =>
      expect(result.current.messages.map((m) => m.id)).toEqual([
        "1",
        "2",
        "3",
        "4",
      ]),
    );
  });

  it("reports isEmpty once loading finishes with no messages", async () => {
    mockedGetMessagesApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useMessages("channel-1", "auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEmpty).toBe(true);
  });
});
