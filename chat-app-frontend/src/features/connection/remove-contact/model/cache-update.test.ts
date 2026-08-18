import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { onMutate, onError, onSuccess } from "./cache-update";
import type { PaginatedContacts } from "@/entities/connection";
import type { InboxChannel } from "@/entities/channel";
import type { User } from "@/entities/user";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("remove-contact cache-update", () => {
  const queryKeys = createQueryKeys("auth-user");

  const variables = { contactUserId: "user-2", contactName: "Jane" };

  type ContactsData = InfiniteData<PaginatedContacts>;

  function seedContacts(queryClient: QueryClient, query: string) {
    queryClient.setQueryData<ContactsData>(
      queryKeys.connections.contacts(query),
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
  }

  const readContacts = (queryClient: QueryClient, query: string) =>
    queryClient.getQueryData<ContactsData>(
      queryKeys.connections.contacts(query),
    );

  describe("onMutate", () => {
    it("optimistically removes the contact and drops the tab total", async () => {
      const queryClient = new QueryClient();
      seedContacts(queryClient, "");

      await onMutate(variables, { client: queryClient, keys: queryKeys });

      const page = readContacts(queryClient, "")?.pages[0];
      expect(page?.contacts.map((c) => c.id)).toEqual(["user-3"]);
      expect(page?.total).toBe(1);
    });

    it("snapshots every cached search variant so a failure can restore them all", async () => {
      const queryClient = new QueryClient();
      seedContacts(queryClient, "");
      seedContacts(queryClient, "jane");

      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });

      expect(context.previousContacts).toHaveLength(2);
      expect(readContacts(queryClient, "")?.pages[0]?.contacts).toHaveLength(1);
      expect(
        readContacts(queryClient, "jane")?.pages[0]?.contacts,
      ).toHaveLength(1);
    });
  });

  describe("onError", () => {
    it("restores every list it optimistically edited and warns the user", async () => {
      const queryClient = new QueryClient();
      seedContacts(queryClient, "");
      seedContacts(queryClient, "jane");

      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });
      onError(new Error("boom"), variables, context);

      for (const query of ["", "jane"]) {
        const page = readContacts(queryClient, query)?.pages[0];
        expect(page?.contacts.map((c) => c.id)).toEqual(["user-2", "user-3"]);
        expect(page?.total).toBe(2);
      }
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("onSuccess", () => {
    it("resets the contact's status so they can be re-added later", async () => {
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

      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });
      onSuccess("connection-1", variables, context);

      expect(
        queryClient.getQueryData<User[]>(queryKeys.users.recommended("")),
      ).toEqual([
        { ...users[0], connectionId: null, connectionStatus: "STRANGER" },
      ]);
    });

    it("closes their direct thread but leaves the history in place", async () => {
      const queryClient = new QueryClient();
      const channel = {
        id: "c1",
        type: "DIRECT",
        canMessage: true,
        recipient: {
          id: "user-2",
          name: "Jane",
          username: "jane",
          image: null,
        },
        messages: [{ id: "m1", content: "hi", createdAt: "2026-07-21" }],
      } as InboxChannel;
      queryClient.setQueryData(queryKeys.channel.details("c1"), channel);

      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });
      onSuccess("connection-1", variables, context);

      const updated = queryClient.getQueryData<InboxChannel>(
        queryKeys.channel.details("c1"),
      );
      expect(updated?.canMessage).toBe(false);
      expect(updated?.messages).toHaveLength(1);
    });

    it("names the removed contact in the confirmation", async () => {
      const queryClient = new QueryClient();
      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });

      onSuccess("connection-1", variables, context);

      expect(toast.success).toHaveBeenCalledWith(
        "Jane removed from contacts",
        expect.objectContaining({
          description: expect.stringContaining("no longer message"),
        }),
      );
    });
  });
});
