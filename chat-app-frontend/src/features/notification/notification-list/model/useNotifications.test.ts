import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useNotifications } from "./useNotifications";
import { getNotificationsApi } from "../api/notifications.api";
import type {
  Notification,
  PaginatedNotifications,
} from "@/entities/notification";

vi.mock("../api/notifications.api", () => ({
  getNotificationsApi: vi.fn(),
}));

const mockedApi = vi.mocked(getNotificationsApi);

function notification(id: string): Notification {
  return {
    id,
    type: "CONNECTION_REQUEST",
    title: "New request",
    content: "Jane sent you a request",
    isRead: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    referenceId: `connection-${id}`,
  };
}

function page(
  notifications: Notification[],
  nextCursor: string | null = null,
): PaginatedNotifications {
  return { notifications, hasMore: !!nextCursor, nextCursor };
}

describe("useNotifications", () => {
  it("fetches notifications on mount with a null cursor", async () => {
    mockedApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useNotifications("auth-user"), { wrapper: Wrapper });

    await waitFor(() =>
      expect(mockedApi).toHaveBeenCalledWith({ params: { cursor: null } }),
    );
  });

  it("returns the flattened notifications list once loaded", async () => {
    const notifications = [notification("1")];
    mockedApi.mockResolvedValue(page(notifications));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useNotifications("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toEqual(notifications);
    expect(result.current.isEmpty).toBe(false);
  });

  it("reports isEmpty once loading finishes with no notifications", async () => {
    mockedApi.mockResolvedValue(page([]));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useNotifications("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isEmpty).toBe(true);
  });

  it("requests the next page using the previous page's cursor", async () => {
    const pageOne = [notification("1")];
    const pageTwo = [notification("2")];
    mockedApi
      .mockResolvedValueOnce(page(pageOne, "cursor-2"))
      .mockResolvedValueOnce(page(pageTwo));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useNotifications("auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    result.current.fetchNextPage();

    await waitFor(() =>
      expect(mockedApi).toHaveBeenLastCalledWith({
        params: { cursor: "cursor-2" },
      }),
    );
    await waitFor(() =>
      expect(result.current.notifications).toEqual([...pageOne, ...pageTwo]),
    );
  });
});
