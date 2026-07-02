import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useUnreadCounts } from "./useUnreadCounts";
import { getUnreadCountsApi } from "../api/stats.api";

vi.mock("../api/stats.api", () => ({
  getUnreadCountsApi: vi.fn(),
}));

const mockedApi = vi.mocked(getUnreadCountsApi);

describe("useUnreadCounts", () => {
  it("fetches the unread counts on mount", async () => {
    mockedApi.mockResolvedValue({});
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useUnreadCounts("auth-user"), { wrapper: Wrapper });

    await waitFor(() => expect(mockedApi).toHaveBeenCalled());
  });

  it("returns the unread counts once loaded", async () => {
    const counts = { pendingRequestsCount: 2, unreadNotificationsCount: 5 };
    mockedApi.mockResolvedValue(counts);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUnreadCounts("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.unreadCounts).toEqual(counts));
  });

  it("defaults to an empty object before data resolves", () => {
    mockedApi.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useUnreadCounts("auth-user"), {
      wrapper: Wrapper,
    });

    expect(result.current.unreadCounts).toEqual({});
  });
});
