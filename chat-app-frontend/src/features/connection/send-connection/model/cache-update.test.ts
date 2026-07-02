import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { onMutate, onError, onSuccess } from "./cache-update";
import type { Connection } from "@/entities/connection";
import type { User } from "@/entities/user";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("send-connection cache-update", () => {
  const queryKeys = createQueryKeys("auth-user");

  const newRequest: Connection = {
    id: "connection-1",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: { id: "user-2", name: "Jane", username: "jane", image: "jane.png" },
  };

  describe("onMutate", () => {
    it("snapshots the previous sent-requests cache for rollback", async () => {
      const queryClient = new QueryClient();
      const original = { pages: [{ connections: [] }] };
      queryClient.setQueryData(queryKeys.connections.sent(), original);

      const context = await onMutate(
        { receiverId: "user-2" },
        { client: queryClient, keys: queryKeys },
      );

      expect(context.previousRequests).toEqual(original);
    });
  });

  describe("onError", () => {
    it("shows an error toast", () => {
      onError(new Error("failed"), { receiverId: "user-2" }, undefined);

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("onSuccess", () => {
    it("prepends the new request to the first page of the sent-requests cache", () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKeys.connections.sent(), {
        pages: [{ connections: [] }, { connections: [] }],
      });

      onSuccess(newRequest, { receiverId: "user-2" }, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      const sent = queryClient.getQueryData<{
        pages: { connections: Connection[] }[];
      }>(queryKeys.connections.sent());
      expect(sent?.pages[0]?.connections).toEqual([newRequest]);
      expect(sent?.pages[1]?.connections).toEqual([]);
    });

    it("flips the recipient's recommended-user status to PENDING_SENT", () => {
      const queryClient = new QueryClient();
      const users: User[] = [
        {
          id: "user-2",
          name: "Jane",
          username: "jane",
          connectionStatus: "STRANGER",
          connectionId: null,
        },
      ];
      queryClient.setQueryData(queryKeys.users.recommended(""), users);

      onSuccess(newRequest, { receiverId: "user-2" }, {
        previousRequests: undefined,
        client: queryClient,
        keys: queryKeys,
      });

      expect(
        queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
      ).toEqual([
        {
          ...users[0],
          connectionStatus: "PENDING_SENT",
          connectionId: "connection-1",
        },
      ]);
    });
  });
});
