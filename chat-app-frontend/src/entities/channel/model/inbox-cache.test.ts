import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import {
  buildOptimisticGroupChannel,
  prependInboxChannel,
  patchInboxChannel,
} from "./inbox-cache";
import type { InboxChannel, PaginatedInboxChannel } from "./channel.types";

const keys = createQueryKeys("auth-user");

type InboxData = InfiniteData<PaginatedInboxChannel>;

function inboxData(channels: InboxChannel[]): InboxData {
  return {
    pages: [{ channels, hasMore: false, nextCursor: null }],
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
