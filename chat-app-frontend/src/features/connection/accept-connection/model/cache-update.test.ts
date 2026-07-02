import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { onMutate, onError, onSuccess } from "./cache-update";
import type { Connection, ConnectionUser } from "@/entities/connection";
import type { User } from "@/entities/user";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("accept-connection cache-update", () => {
  const queryKeys = createQueryKeys("auth-user");

  const connection: Connection = {
    id: "connection-1",
    status: "ACCEPTED",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: { id: "user-2", name: "Jane", username: "jane", image: "jane.png" },
  };

  describe("onMutate", () => {
    it("optimistically removes the request from the received requests cache", async () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKeys.connections.received(), {
        pages: [{ connections: [connection] }],
      });

      await onMutate(connection.id, { client: queryClient, keys: queryKeys });

      const received = queryClient.getQueryData<{
        pages: { connections: Connection[] }[];
      }>(queryKeys.connections.received());
      expect(received?.pages[0]?.connections).toEqual([]);
    });

    it("returns a snapshot of the previous cache for rollback", async () => {
      const queryClient = new QueryClient();
      const original = { pages: [{ connections: [connection] }] };
      queryClient.setQueryData(queryKeys.connections.received(), original);

      const context = await onMutate(connection.id, {
        client: queryClient,
        keys: queryKeys,
      });

      expect(context.previousRequests).toEqual(original);
    });
  });

  describe("onError", () => {
    it("rolls back to the snapshot and shows an error toast", () => {
      const queryClient = new QueryClient();
      const original = { pages: [{ connections: [connection] }] };

      onError(new Error("failed"), connection.id, {
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
    it("prepends the new contact to the first page of the contacts cache", () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKeys.connections.contacts(""), {
        pages: [{ contacts: [] }],
      });

      onSuccess(connection, connection.id, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      const contacts = queryClient.getQueryData<{
        pages: { contacts: ConnectionUser[] }[];
      }>(queryKeys.connections.contacts(""));
      expect(contacts?.pages[0]?.contacts).toMatchObject([
        { id: "user-2", name: "Jane", username: "jane" },
      ]);
    });

    it("flips the new contact's recommended-user status to CONTACT", () => {
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

      onSuccess(connection, connection.id, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      expect(
        queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
      ).toEqual([{ ...users[0], connectionStatus: "CONTACT" }]);
    });

    it("decrements the pending requests badge count", () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKeys.dashboard.badges(), {
        pendingRequestsCount: 3,
      });

      onSuccess(connection, connection.id, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
        pendingRequestsCount: 2,
      });
    });

    it("shows a success toast", () => {
      const queryClient = new QueryClient();

      onSuccess(connection, connection.id, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      expect(toast.success).toHaveBeenCalled();
    });
  });
});
