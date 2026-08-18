import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import {
  buildOptimisticGroupChannel,
  prependInboxChannel,
  patchInboxChannel,
  invalidateInboxFilters,
  closeDirectChannelWith,
} from "./inbox-cache";
import type { InboxChannel, PaginatedInboxChannel } from "./channel.types";

const keys = createQueryKeys("auth-user");

type InboxData = InfiniteData<PaginatedInboxChannel>;

function inboxData(channels: InboxChannel[]): InboxData {
  return {
    pages: [
      { channels, hasMore: false, nextCursor: null, total: channels.length },
    ],
    pageParams: [null],
  };
}

function channel(id: string, name = id): InboxChannel {
  return buildOptimisticGroupChannel(id, name);
}

function readInbox(qc: QueryClient, query = ""): InboxData | undefined {
  return qc.getQueryData<InboxData>(keys.inbox.list(query));
}

describe("buildOptimisticGroupChannel", () => {
  it("mirrors the group inbox transform (displayName = name, empty/zero rest)", () => {
    const c = buildOptimisticGroupChannel("c1", "Weekend Trip");

    expect(c).toMatchObject({
      id: "c1",
      type: "GROUP",
      name: "Weekend Trip",
      displayName: "Weekend Trip",
      displayImage: "",
      channelMembers: [],
      lastMessage: null,
      unreadCount: 0,
    });
  });
});

describe("prependInboxChannel", () => {
  it("adds the channel to the front of the first page", () => {
    const qc = new QueryClient();
    qc.setQueryData(keys.inbox.list(""), inboxData([channel("existing")]));

    prependInboxChannel(qc, keys, channel("new"));

    expect(readInbox(qc)?.pages[0].channels.map((c) => c.id)).toEqual([
      "new",
      "existing",
    ]);
  });

  it("is idempotent — does not duplicate an already-present channel", () => {
    const qc = new QueryClient();
    qc.setQueryData(keys.inbox.list(""), inboxData([channel("dup")]));

    prependInboxChannel(qc, keys, channel("dup"));

    expect(readInbox(qc)?.pages[0].channels.map((c) => c.id)).toEqual(["dup"]);
  });

  it("patches every cached search-query variant of the inbox list", () => {
    const qc = new QueryClient();
    qc.setQueryData(keys.inbox.list(""), inboxData([]));
    qc.setQueryData(keys.inbox.list("we"), inboxData([]));

    prependInboxChannel(qc, keys, channel("new"));

    expect(readInbox(qc, "")?.pages[0].channels).toHaveLength(1);
    expect(readInbox(qc, "we")?.pages[0].channels).toHaveLength(1);
  });
});

describe("invalidateInboxFilters", () => {
  it("invalidates only the named filter lists, leaving 'all' untouched", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");

    invalidateInboxFilters(qc, ["unread"]);

    const predicate = spy.mock.calls[0][0]?.predicate as
      ((q: { queryKey: readonly unknown[] }) => boolean) | undefined;
    expect(predicate).toBeTypeOf("function");

    const matches = (key: readonly unknown[]) => predicate!({ queryKey: key });

    expect(matches(keys.inbox.list("", "unread"))).toBe(true);
    expect(matches(keys.inbox.list("jane", "unread"))).toBe(true);
    expect(matches(keys.inbox.list("", "all"))).toBe(false);
    expect(matches(keys.inbox.list("", "groups"))).toBe(false);
  });
});

describe("patchInboxChannel", () => {
  it("applies the patch to the matching channel and leaves others untouched", () => {
    const qc = new QueryClient();
    qc.setQueryData(
      keys.inbox.list(""),
      inboxData([channel("c1", "Old"), channel("c2", "Other")]),
    );

    patchInboxChannel(qc, keys, "c1", { name: "New", displayName: "New" });

    const channels = readInbox(qc)?.pages[0].channels ?? [];
    expect(channels.find((c) => c.id === "c1")).toMatchObject({
      name: "New",
      displayName: "New",
    });
    expect(channels.find((c) => c.id === "c2")?.name).toBe("Other");
  });
});

describe("closeDirectChannelWith", () => {
  /** A channel-details payload as the detail endpoint returns it. */
  function details(
    id: string,
    overrides: Partial<InboxChannel> = {},
  ): InboxChannel {
    return {
      ...buildOptimisticGroupChannel(id, id),
      type: "DIRECT",
      recipient: { id: "them", name: "Them", username: "them", image: null },
      canMessage: true,
      ...overrides,
    };
  }

  const readDetails = (qc: QueryClient, id: string) =>
    qc.getQueryData<InboxChannel>(keys.channel.details(id));

  it("closes the direct thread with the removed user", () => {
    const qc = new QueryClient();
    qc.setQueryData(keys.channel.details("c1"), details("c1"));

    closeDirectChannelWith(qc, "them");

    expect(readDetails(qc, "c1")?.canMessage).toBe(false);
  });

  it("leaves other people's threads open", () => {
    const qc = new QueryClient();
    qc.setQueryData(
      keys.channel.details("c2"),
      details("c2", {
        recipient: {
          id: "someone-else",
          name: "Other",
          username: "other",
          image: null,
        },
      }),
    );

    closeDirectChannelWith(qc, "them");

    expect(readDetails(qc, "c2")?.canMessage).toBe(true);
  });

  it("never closes a group — membership is the permission there", () => {
    const qc = new QueryClient();
    qc.setQueryData(
      keys.channel.details("g1"),
      details("g1", { type: "GROUP", recipient: null }),
    );

    closeDirectChannelWith(qc, "them");

    expect(readDetails(qc, "g1")?.canMessage).toBe(true);
  });

  it("leaves an already-closed thread byte-identical", () => {
    const qc = new QueryClient();
    const closed = details("c1", { canMessage: false });
    qc.setQueryData(keys.channel.details("c1"), closed);

    closeDirectChannelWith(qc, "them");

    expect(readDetails(qc, "c1")).toBe(closed);
  });
});
