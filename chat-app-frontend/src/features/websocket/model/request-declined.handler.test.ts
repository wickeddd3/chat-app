import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleDeclinedRequest } from "./request-declined.handler";
import type { Connection } from "@/entities/connection";
import type { User } from "@/entities/user";

describe("handleDeclinedRequest", () => {
  const queryKeys = createQueryKeys("auth-user");

  const payload = { receiverId: "user-2", connectionId: "connection-1" };

  it("removes the declined request from the sent requests cache", () => {
    const queryClient = new QueryClient();
    const connection = { id: "connection-1" } as Connection;
    queryClient.setQueryData(queryKeys.connections.sent(), {
      pages: [{ connections: [connection] }],
    });

    handleDeclinedRequest(queryClient, queryKeys, payload);

    const sent = queryClient.getQueryData<{
      pages: { connections: Connection[] }[];
    }>(queryKeys.connections.sent());
    expect(sent?.pages[0]?.connections).toEqual([]);
  });

  it("resets the receiver's connectionStatus back to STRANGER", () => {
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

    handleDeclinedRequest(queryClient, queryKeys, payload);

    expect(
      queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
    ).toEqual([
      { ...users[0], connectionId: null, connectionStatus: "STRANGER" },
    ]);
  });
});
