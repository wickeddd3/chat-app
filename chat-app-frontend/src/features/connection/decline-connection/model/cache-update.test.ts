import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { onMutate, onError, onSuccess } from "./cache-update";
import type { Connection } from "@/entities/connection";
import type { Notification } from "@/entities/notification";
import type { User } from "@/entities/user";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("decline-connection cache-update", () => {
  const queryKeys = createQueryKeys("auth-user");

  const variables = {
    connectionRequestId: "connection-1",
    connectionRequestUserId: "user-2",
  };

  describe("onMutate", () => {
    it("optimistically removes the request from the received requests cache", async () => {
      const queryClient = new QueryClient();
      const connection = { id: "connection-1" } as Connection;
      queryClient.setQueryData(queryKeys.connections.received(), {
        pages: [{ connections: [connection] }],
      });

      await onMutate(variables, { client: queryClient, keys: queryKeys });

      const received = queryClient.getQueryData<{
        pages: { connections: Connection[] }[];
      }>(queryKeys.connections.received());
      expect(received?.pages[0]?.connections).toEqual([]);
    });
  });

  describe("onError", () => {
    it("rolls back to the snapshot and shows an error toast", () => {
      const queryClient = new QueryClient();
      const original = { pages: [{ connections: [{ id: "connection-1" }] }] };

      onError(new Error("failed"), variables, {
        previousRequests: original,
        client: queryClient,
        keys: queryKeys,
      });

      expect(
        queryClient.getQueryData(queryKeys.connections.received()),
      ).toEqual(original);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("onSuccess", () => {
    it("resets the sender's recommended-user status to STRANGER", () => {
      const queryClient = new QueryClient();
      const users: User[] = [
        {
          id: "user-2",
          name: "Jane",
          username: "jane",
          connectionStatus: "PENDING_RECEIVED",
          connectionId: "connection-1",
        },
      ];
      queryClient.setQueryData(queryKeys.users.recommended(""), users);

      onSuccess("connection-1", variables, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      const updated = queryClient.getQueryData<User[]>(
        queryKeys.users.recommended(""),
      );
      expect(updated?.[0]?.connectionStatus).toBe("STRANGER");
      expect(updated?.[0]?.connectionId).toBeNull();
    });

    it("removes the matching connection-request notification", () => {
      const queryClient = new QueryClient();
      const notification = {
        id: "notif-1",
        referenceId: "connection-1",
      } as Notification;
      const otherNotification = {
        id: "notif-2",
        referenceId: "connection-2",
      } as Notification;
      queryClient.setQueryData(queryKeys.notifications.list(), {
        pages: [{ notifications: [notification, otherNotification] }],
      });

      onSuccess("connection-1", variables, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      const list = queryClient.getQueryData<{
        pages: { notifications: Notification[] }[];
      }>(queryKeys.notifications.list());
      expect(list?.pages[0]?.notifications).toEqual([otherNotification]);
    });

    it("decrements pending request and unread notification counts", () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKeys.dashboard.badges(), {
        pendingRequestsCount: 2,
        unreadNotificationsCount: 3,
      });

      onSuccess("connection-1", variables, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
        pendingRequestsCount: 1,
        unreadNotificationsCount: 2,
      });
    });

    it("shows a success toast", () => {
      const queryClient = new QueryClient();

      onSuccess("connection-1", variables, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      expect(toast.success).toHaveBeenCalled();
    });
  });
});
