import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useSentConnectionRequests } from "./useSentConnectionRequests";
import { sentConnectionRequestsApi } from "../api/connections.api";
import type { Connection, PaginatedConnections } from "@/entities/connection";

vi.mock("../api/connections.api", () => ({
  sentConnectionRequestsApi: vi.fn(),
}));

const mockedApi = vi.mocked(sentConnectionRequestsApi);

function connection(id: string): Connection {
  return {
    id,
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: { id: `user-${id}`, name: "Jane", username: "jane" },
  };
}

function page(
  connections: Connection[],
  nextCursor: string | null = null,
): PaginatedConnections {
  return {
    connections,
    hasMore: !!nextCursor,
    nextCursor,
    total: connections.length,
  };
}

describe("useSentConnectionRequests", () => {
  it("fetches sent requests on mount with a null cursor", async () => {
    mockedApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useSentConnectionRequests("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith({ params: { cursor: null } }),
    );
  });

  it("returns the flattened requests list once loaded", async () => {
    const connections = [connection("1")];
    mockedApi.mockResolvedValue(page(connections));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useSentConnectionRequests("auth-user"),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sentRequests).toEqual(connections);
    expect(result.current.isEmpty).toBe(false);
  });

  it("reports isEmpty once loading finishes with no requests", async () => {
    mockedApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useSentConnectionRequests("auth-user"),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEmpty).toBe(true);
  });

  it("requests the next page using the previous page's cursor", async () => {
    const pageOne = [connection("1")];
    const pageTwo = [connection("2")];
    mockedApi
      .mockResolvedValueOnce(page(pageOne, "cursor-2"))
      .mockResolvedValueOnce(page(pageTwo));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useSentConnectionRequests("auth-user"),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    result.current.fetchNextPage();

    await waitFor(() =>
      expect(mockedApi).toHaveBeenLastCalledWith({
        params: { cursor: "cursor-2" },
      }),
    );
    await waitFor(() =>
      expect(result.current.sentRequests).toEqual([...pageOne, ...pageTwo]),
    );
  });

  it("exposes the server-reported total, independent of the loaded page size", async () => {
    mockedApi.mockResolvedValue({
      connections: [],
      hasMore: true,
      nextCursor: "cursor-2",
      total: 42,
    });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(
      () => useSentConnectionRequests("auth-user"),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => expect(result.current.total).toBe(42));
  });
});
