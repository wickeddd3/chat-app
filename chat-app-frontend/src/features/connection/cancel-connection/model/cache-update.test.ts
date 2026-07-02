import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { onMutate, onError, onSuccess } from "./cache-update";
import type { Connection } from "@/entities/connection";
import type { User } from "@/entities/user";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("cancel-connection cache-update", () => {
  const queryKeys = createQueryKeys("auth-user");

  const variables = {
    connectionRequestId: "connection-1",
    connectionRequestUserId: "user-2",
  };

  describe("onMutate", () => {
    it("optimistically removes the request from the sent requests cache", async () => {
      const queryClient = new QueryClient();
      const connection = { id: "connection-1" } as Connection;
      queryClient.setQueryData(queryKeys.connections.sent(), {
        pages: [{ connections: [connection] }],
      });

      await onMutate(variables, { client: queryClient, keys: queryKeys });

      const sent = queryClient.getQueryData<{
        pages: { connections: Connection[] }[];
      }>(queryKeys.connections.sent());
      expect(sent?.pages[0]?.connections).toEqual([]);
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

      expect(queryClient.getQueryData(queryKeys.connections.sent())).toEqual(
        original,
      );
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("onSuccess", () => {
    it("resets the recipient's recommended-user status to STRANGER", () => {
      const queryClient = new QueryClient();
      const users: User[] = [
        {
          id: "user-2",
          name: "Jane",
          username: "jane",
          connectionStatus: "PENDING_SENT",
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
    });

    it("clears connectionId when resetting the recipient to STRANGER", () => {
      const queryClient = new QueryClient();
      const users: User[] = [
        {
          id: "user-2",
          name: "Jane",
          username: "jane",
          connectionStatus: "PENDING_SENT",
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
      expect(updated?.[0]?.connectionId).toBeNull();
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
