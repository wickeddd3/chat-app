import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { onMutate, onError, onSuccess } from "./cache-update";
import type { Notification } from "@/entities/notification";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("mark-as-read cache-update", () => {
  const queryKeys = createQueryKeys("auth-user");

  describe("onMutate", () => {
    it("snapshots the previous notifications cache for rollback", async () => {
      const queryClient = new QueryClient();
      const original = { pages: [{ notifications: [] }] };
      queryClient.setQueryData(queryKeys.notifications.list(), original);

      const context = await onMutate(["notif-1"], {
        client: queryClient,
        keys: queryKeys,
      });

      expect(context.previousRequests).toEqual(original);
    });
  });

  describe("onError", () => {
    it("shows an error toast", () => {
      onError(new Error("failed"), ["notif-1"], undefined);

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("onSuccess", () => {
    it("marks only the notifications in the given ids as read", () => {
      const queryClient = new QueryClient();
      const notifications: Notification[] = [
        {
          id: "notif-1",
          type: "CONNECTION_REQUEST",
          title: "A",
          content: "a",
          isRead: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          referenceId: "connection-1",
        },
        {
          id: "notif-2",
          type: "CONNECTION_REQUEST",
          title: "B",
          content: "b",
          isRead: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          referenceId: "connection-2",
        },
      ];
      queryClient.setQueryData(queryKeys.notifications.list(), {
        pages: [{ notifications }],
      });

      onSuccess({ count: 1 }, ["notif-1"], {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      const list = queryClient.getQueryData<{
        pages: { notifications: Notification[] }[];
      }>(queryKeys.notifications.list());
      expect(list?.pages[0]?.notifications).toEqual([
        { ...notifications[0], isRead: true },
        notifications[1],
      ]);
    });

    it("decrements the unread notifications badge count", () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKeys.dashboard.badges(), {
        unreadNotificationsCount: 4,
      });

      onSuccess({ count: 1 }, ["notif-1"], {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
        unreadNotificationsCount: 3,
      });
    });
  });
});
