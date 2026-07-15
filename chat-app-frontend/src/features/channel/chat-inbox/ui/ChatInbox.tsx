import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { Badge } from "@/shared/ui/shadcn/badge";
import { SearchField } from "@/shared/ui/SearchField";
import { ChatInboxResults } from "./ChatInboxResults";
import { useCallback, useMemo, useState } from "react";
import { useAuth, usePresence } from "@/entities/auth";
import type { InboxChannel } from "@/entities/channel";
import { useInbox } from "../model/useInbox";

export function ChatInbox() {
  const { authUser } = useAuth();
  const { isOnline } = usePresence();

  const [query, setQuery] = useState("");

  // One server-filtered query per tab: the list content and the badge total both
  // come from the backend, so a group/unread channel on a later page is no longer
  // hidden just because it hasn't been paged into the "all" list yet.
  const all = useInbox(authUser?.id, query, "all");
  const unread = useInbox(authUser?.id, query, "unread");
  const groups = useInbox(authUser?.id, query, "groups");

  // Stamps each row with a live `online` flag derived from presence — drives the
  // avatar presence dot on every tab.
  const withOnline = useCallback(
    (items: InboxChannel[]) =>
      items.map((item) => ({
        ...item,
        online: item.channelMembers.some(
          (member) =>
            member.user.id !== authUser?.id && isOnline(member.user.id),
        ),
      })),
    [authUser?.id, isOnline],
  );

  const allInbox = useMemo(
    () => withOnline(all.inbox),
    [withOnline, all.inbox],
  );
  const unreadInbox = useMemo(
    () => withOnline(unread.inbox),
    [withOnline, unread.inbox],
  );
  const groupsInbox = useMemo(
    () => withOnline(groups.inbox),
    [withOnline, groups.inbox],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <SearchField
        value={query}
        onChange={setQuery}
        className="px-4 pb-6 pt-1"
      />
      <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit px-2 bg-transparent shrink-0">
          <TabsTrigger value="all" className="px-3 cursor-pointer rounded-full">
            All
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="px-3 cursor-pointer rounded-full"
          >
            Unread
            <Badge className="border-4 py-2.5 rounded-full border-background bg-muted text-foreground font-bold">
              {unread.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="px-3 cursor-pointer rounded-full"
          >
            Groups
            <Badge className="border-4 py-2.5 rounded-full border-background bg-muted text-foreground font-bold">
              {groups.total}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="all"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ChatInboxResults
            results={allInbox}
            isLoading={all.isLoading}
            isEmpty={all.isEmpty}
            hasNextPage={all.hasNextPage}
            isFetchingNextPage={all.isFetchingNextPage}
            fetchNextPage={all.fetchNextPage}
          />
        </TabsContent>
        <TabsContent
          value="unread"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ChatInboxResults
            results={unreadInbox}
            isLoading={unread.isLoading}
            isEmpty={unread.isEmpty}
            hasNextPage={unread.hasNextPage}
            isFetchingNextPage={unread.isFetchingNextPage}
            fetchNextPage={unread.fetchNextPage}
          />
        </TabsContent>
        <TabsContent
          value="groups"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ChatInboxResults
            results={groupsInbox}
            isLoading={groups.isLoading}
            isEmpty={groups.isEmpty}
            hasNextPage={groups.hasNextPage}
            isFetchingNextPage={groups.isFetchingNextPage}
            fetchNextPage={groups.fetchNextPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
