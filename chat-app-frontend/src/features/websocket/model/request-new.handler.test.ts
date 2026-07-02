import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleNewRequest } from "./request-new.handler";
import type { Connection } from "@/entities/connection";
import type { User } from "@/entities/user";

describe("handleNewRequest", () => {
  const queryKeys = createQueryKeys("auth-user");

  const connection: Connection = {
    id: "connection-1",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: {
      id: "user-2",
      name: "Jane",
      username: "jane",
      image: "jane.png",
    },
  };

  it("prepends the new request to the first page of received requests", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.connections.received(), {
      pages: [{ connections: [] }, { connections: [] }],
    });

    handleNewRequest(queryClient, queryKeys, connection);

    const received = queryClient.getQueryData<{
      pages: { connections: Connection[] }[];
    }>(queryKeys.connections.received());
    expect(received?.pages[0]?.connections).toEqual([connection]);
    expect(received?.pages[1]?.connections).toEqual([]);
  });

  it("increments the pending request count", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.dashboard.badges(), {
      pendingRequestsCount: 1,
    });

    handleNewRequest(queryClient, queryKeys, connection);

    expect(queryClient.getQueryData(queryKeys.dashboard.badges())).toEqual({
      pendingRequestsCount: 2,
    });
  });

  it("flips the sender's connectionStatus to PENDING_RECEIVED", () => {
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

    handleNewRequest(queryClient, queryKeys, connection);

    expect(
      queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
    ).toEqual([
      {
        ...users[0],
        connectionId: "connection-1",
        connectionStatus: "PENDING_RECEIVED",
      },
    ]);
  });
});
