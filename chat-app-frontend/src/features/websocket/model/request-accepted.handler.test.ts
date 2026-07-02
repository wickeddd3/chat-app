import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleAcceptedRequest } from "./request-accepted.handler";
import type { Connection, ConnectionUser } from "@/entities/connection";
import type { User } from "@/entities/user";

describe("handleAcceptedRequest", () => {
  const queryKeys = createQueryKeys("auth-user");

  const connection: Connection = {
    id: "connection-1",
    status: "ACCEPTED",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: {
      id: "user-2",
      name: "Jane",
      username: "jane",
      image: "jane.png",
    },
  };

  it("removes the accepted request from the sent requests cache", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.connections.sent(), {
      pages: [{ connections: [connection] }],
    });

    handleAcceptedRequest(queryClient, queryKeys, connection);

    const sent = queryClient.getQueryData<{
      pages: { connections: Connection[] }[];
    }>(queryKeys.connections.sent());
    expect(sent?.pages[0]?.connections).toEqual([]);
  });

  it("prepends the new contact to the first page of the contacts cache", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.connections.contacts(""), {
      pages: [{ contacts: [] }, { contacts: [] }],
    });

    handleAcceptedRequest(queryClient, queryKeys, connection);

    const contacts = queryClient.getQueryData<{
      pages: { contacts: ConnectionUser[] }[];
    }>(queryKeys.connections.contacts(""));
    expect(contacts?.pages[0]?.contacts).toMatchObject([
      { id: "user-2", name: "Jane", username: "jane" },
    ]);
    expect(contacts?.pages[1]?.contacts).toEqual([]);
  });

  it("flips the recommended user's connectionStatus to CONTACT", () => {
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

    handleAcceptedRequest(queryClient, queryKeys, connection);

    expect(
      queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
    ).toEqual([{ ...users[0], connectionStatus: "CONTACT" }]);
  });
});
