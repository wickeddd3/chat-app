import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { onMutate, onError, onSuccess } from "./cache-update";
import type { InboxChannel, PaginatedInboxChannel } from "@/entities/channel";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("leave-group-channel cache-update", () => {
  const queryKeys = createQueryKeys("auth-user");

  const variables = { channelId: "c1", channelName: "Team" };
  const left = { channelId: "c1", channelDeleted: false };

  type InboxData = InfiniteData<PaginatedInboxChannel>;

  function seedInbox(queryClient: QueryClient, query = "", filter?: "groups") {
    queryClient.setQueryData<InboxData>(
      filter
        ? queryKeys.inbox.list(query, filter)
        : queryKeys.inbox.list(query),
      {
        pages: [
          {
            channels: [
              { id: "c1", name: "Team" } as InboxChannel,
              { id: "c2", name: "Other" } as InboxChannel,
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

  const readInbox = (queryClient: QueryClient, query = "") =>
    queryClient.getQueryData<InboxData>(queryKeys.inbox.list(query));

  describe("onMutate", () => {
    it("optimistically drops the group and decrements the tab total", async () => {
      const queryClient = new QueryClient();
      seedInbox(queryClient);

      await onMutate(variables, { client: queryClient, keys: queryKeys });

      const page = readInbox(queryClient)?.pages[0];
      expect(page?.channels.map((c) => c.id)).toEqual(["c2"]);
      expect(page?.total).toBe(1);
    });

    it("snapshots every cached list variant so a failure restores them all", async () => {
      const queryClient = new QueryClient();
      seedInbox(queryClient);
      seedInbox(queryClient, "", "groups");

      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });

      expect(context.previousInbox).toHaveLength(2);
    });
  });

  describe("onError", () => {
    it("puts the group back and warns the user", async () => {
      const queryClient = new QueryClient();
      seedInbox(queryClient);

      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });
      onError(new Error("boom"), variables, context);

      const page = readInbox(queryClient)?.pages[0];
      expect(page?.channels.map((c) => c.id)).toEqual(["c1", "c2"]);
      expect(page?.total).toBe(2);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("onSuccess", () => {
    it("discards the channel's detail and timeline, which are no longer readable", async () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKeys.channel.details("c1"), { id: "c1" });
      queryClient.setQueryData(queryKeys.messages.timeline("c1"), {
        pages: [],
      });

      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });
      onSuccess(left, variables, context);

      expect(
        queryClient.getQueryData(queryKeys.channel.details("c1")),
      ).toBeUndefined();
      expect(
        queryClient.getQueryData(queryKeys.messages.timeline("c1")),
      ).toBeUndefined();
    });

    it("names the group it left", async () => {
      const queryClient = new QueryClient();
      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });

      onSuccess(left, variables, context);

      expect(toast.success).toHaveBeenCalledWith("You left Team", undefined);
    });

    it("reports deletion when the server says it was the last member out", async () => {
      const queryClient = new QueryClient();
      const context = await onMutate(variables, {
        client: queryClient,
        keys: queryKeys,
      });

      onSuccess({ channelId: "c1", channelDeleted: true }, variables, context);

      expect(toast.success).toHaveBeenCalledWith(
        "Team was deleted",
        expect.objectContaining({
          description: expect.stringContaining("last member"),
        }),
      );
    });
  });
});
