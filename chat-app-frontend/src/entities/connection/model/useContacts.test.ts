import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useContacts } from "./useContacts";
import { getContactsApi } from "../api/connections.api";
import type { ConnectionUser, PaginatedContacts } from "./connection.types";

vi.mock("../api/connections.api", () => ({
  getContactsApi: vi.fn(),
}));

const mockedGetContactsApi = vi.mocked(getContactsApi);

function page(
  contacts: ConnectionUser[],
  nextCursor: string | null = null,
): PaginatedContacts {
  return {
    contacts,
    hasMore: !!nextCursor,
    nextCursor,
    total: contacts.length,
  };
}

describe("useContacts", () => {
  beforeEach(() => {
    mockedGetContactsApi.mockResolvedValue(page([]));
  });

  it("fetches contacts on mount with no query param when query is empty", async () => {
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useContacts("auth-user"), { wrapper: Wrapper });

    await waitFor(() =>
      expect(mockedGetContactsApi).toHaveBeenCalledWith({
        params: { cursor: null },
      }),
    );
  });

  it("debounces query changes before refetching", async () => {
    const { Wrapper } = createQueryClientWrapper();

    const { rerender } = renderHook(
      ({ query }) => useContacts("auth-user", query),
      { wrapper: Wrapper, initialProps: { query: "" } },
    );

    await waitFor(() => expect(mockedGetContactsApi).toHaveBeenCalledTimes(1));
    mockedGetContactsApi.mockClear();

    rerender({ query: "ja" });

    // Still within the 500ms debounce window, so no refetch yet
    expect(mockedGetContactsApi).not.toHaveBeenCalled();

    await waitFor(
      () =>
        expect(mockedGetContactsApi).toHaveBeenCalledWith({
          params: { cursor: null, query: "ja" },
        }),
      { timeout: 1000 },
    );
  });

  it("returns the flattened contacts list once loaded", async () => {
    const contacts: ConnectionUser[] = [
      { id: "user-1", name: "Jane", username: "jane" },
    ];
    mockedGetContactsApi.mockResolvedValue(page(contacts));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useContacts("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contacts).toEqual(contacts);
    expect(result.current.isEmpty).toBe(false);
  });

  it("exposes the server-reported total, independent of the loaded page size", async () => {
    mockedGetContactsApi.mockResolvedValue({
      contacts: [{ id: "user-1", name: "Jane", username: "jane" }],
      hasMore: true,
      nextCursor: "cursor-2",
      total: 42,
    });
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useContacts("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contacts).toHaveLength(1);
    expect(result.current.total).toBe(42);
  });

  it("reports isEmpty once loading finishes with no results", async () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useContacts("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEmpty).toBe(true);
  });

  it("requests the next page using the previous page's cursor", async () => {
    const pageOneContacts: ConnectionUser[] = [
      { id: "user-1", name: "Jane", username: "jane" },
    ];
    const pageTwoContacts: ConnectionUser[] = [
      { id: "user-2", name: "Alex", username: "alex" },
    ];
    mockedGetContactsApi
      .mockResolvedValueOnce(page(pageOneContacts, "cursor-2"))
      .mockResolvedValueOnce(page(pageTwoContacts));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useContacts("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    result.current.fetchNextPage();

    await waitFor(() =>
      expect(mockedGetContactsApi).toHaveBeenLastCalledWith({
        params: { cursor: "cursor-2" },
      }),
    );
    await waitFor(() =>
      expect(result.current.contacts).toEqual([
        ...pageOneContacts,
        ...pageTwoContacts,
      ]),
    );
  });
});
