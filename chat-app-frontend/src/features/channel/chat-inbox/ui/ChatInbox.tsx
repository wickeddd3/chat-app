import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { Badge } from "@/shared/ui/shadcn/badge";
import { SearchField } from "@/shared/ui/SearchField";
import { ChatInboxResults } from "./ChatInboxResults";
import { useMemo, useState } from "react";
import { usePresence } from "@/app/store/PresenceContext";
import { useAuth } from "@/app/store/AuthContext";
import { useInbox } from "../model/useInbox";

export function ChatInbox() {
  const { authUser } = useAuth();

  const [query, setQuery] = useState("");

  const {
    inbox,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInbox(authUser?.id, query);

  const { isOnline } = usePresence();

  const allInbox = useMemo(() => {
    return inbox.map((item) => ({
      ...item,
      online: item.channelMembers.some(
        (member) => member.user.id !== authUser?.id && isOnline(member.user.id),
      ),
    }));
  }, [inbox, authUser, isOnline]);

  const filteredByOnline = useMemo(() => {
    return allInbox.filter((item) => item.online);
  }, [allInbox]);

  const filteredByUnread = useMemo(() => {
    return allInbox.filter((item) => item?.unreadCount);
  }, [allInbox]);

  const filteredByGroup = useMemo(() => {
    return allInbox.filter((item) => item.type === "GROUP");
  }, [allInbox]);

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
            value="online"
            className="px-3 cursor-pointer rounded-full"
          >
            Online
            <Badge className="border-4 py-2.5 rounded-full border-white bg-emerald-500 text-gray-50 font-bold">
              {filteredByOnline.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="px-3 cursor-pointer rounded-full"
          >
            Unread
            <Badge className="border-4 py-2.5 rounded-full border-white bg-gray-200 text-gray-800 font-bold">
              {filteredByUnread.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="px-3 cursor-pointer rounded-full"
          >
            Groups
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="all"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ChatInboxResults
            results={allInbox}
            isLoading={isLoading}
            isEmpty={isEmpty}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </TabsContent>
        <TabsContent
          value="online"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ChatInboxResults
            results={filteredByOnline}
            isLoading={isLoading}
            isEmpty={!filteredByOnline.length}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </TabsContent>
        <TabsContent
          value="unread"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ChatInboxResults
            results={filteredByUnread}
            isLoading={isLoading}
            isEmpty={!filteredByUnread.length}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </TabsContent>
        <TabsContent
          value="groups"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ChatInboxResults
            results={filteredByGroup}
            isLoading={isLoading}
            isEmpty={!filteredByGroup.length}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
