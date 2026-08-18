import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleContactRemoved } from "./contact-removed.handler";
import type { PaginatedContacts } from "@/entities/connection";
import type { InboxChannel } from "@/entities/channel";
import type { User } from "@/entities/user";

describe("handleContactRemoved", () => {
  const queryKeys = createQueryKeys("auth-user");

  // "user-2 removed me" — the mirror of the remover's own optimistic patch.
  const payload = { userId: "user-2", connectionId: "connection-1" };

  it("drops the remover from the contacts list and its tab total", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<InfiniteData<PaginatedContacts>>(
      queryKeys.connections.contacts(""),
      {
        pages: [
          {
            contacts: [
              { id: "user-2", name: "Jane", username: "jane" },
              { id: "user-3", name: "Bob", username: "bob" },
            ],
            total: 2,
            hasMore: false,
            nextCursor: null,
          },
        ],
        pageParams: [null],
      },
    );

    handleContactRemoved(queryClient, queryKeys, payload);

    const contacts = queryClient.getQueryData<InfiniteData<PaginatedContacts>>(
      queryKeys.connections.contacts(""),
    );
    expect(contacts?.pages[0]?.contacts.map((c) => c.id)).toEqual(["user-3"]);
    expect(contacts?.pages[0]?.total).toBe(1);
  });

  it("resets the remover's connectionStatus back to STRANGER", () => {
    const queryClient = new QueryClient();
    const users: User[] = [
      {
        id: "user-2",
        name: "Jane",
        username: "jane",
        connectionStatus: "CONTACT",
        connectionId: "connection-1",
      },
    ];
    queryClient.setQueryData(queryKeys.users.recommended(""), users);

    handleContactRemoved(queryClient, queryKeys, payload);

    expect(
      queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
    ).toEqual([
      { ...users[0], connectionId: null, connectionStatus: "STRANGER" },
    ]);
  });

  it("closes the composer on their direct thread without touching the history", () => {
    const queryClient = new QueryClient();
    const channel = {
      id: "c1",
      type: "DIRECT",
      canMessage: true,
      recipient: { id: "user-2", name: "Jane", username: "jane", image: null },
      messages: [{ id: "m1", content: "hi", createdAt: "2026-07-21" }],
    } as InboxChannel;
    queryClient.setQueryData(queryKeys.channel.details("c1"), channel);

    handleContactRemoved(queryClient, queryKeys, payload);

    const updated = queryClient.getQueryData<InboxChannel>(
      queryKeys.channel.details("c1"),
    );
    expect(updated?.canMessage).toBe(false);
    expect(updated?.messages).toHaveLength(1);
  });
});
