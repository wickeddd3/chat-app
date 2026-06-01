import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { SearchField } from "@/shared/ui/SearchField";
import { ChatInboxResults } from "./ChatInboxResults";
import { useMemo, useState } from "react";
import { usePresence } from "@/app/store/PresenceContext";
import { useAuth } from "@/entities/auth";
import { useInbox } from "../model/useInbox";
import { useInboxUpdate } from "../model/useInboxUpdate";

export function ChatInbox() {
  const { authId } = useAuth();

  const [query, setQuery] = useState("");

  const {
    inbox,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInbox(query);

  const { onlineUsers, isOnline } = usePresence();
  useInboxUpdate();

  const allInbox = useMemo(() => {
    return inbox.map((item) => ({
      ...item,
      online: () => {
        if (item.type === "GROUP") {
          return item.channelMembers.some(
            (member) => member.user.id !== authId && isOnline(member.user.id),
          );
        }
        if (item.type === "DIRECT") {
          const otherUser = item.channelMembers.find(
            (member) => member.user.id !== authId && isOnline(member.user.id),
          );
          return !!otherUser;
        }
        return false;
      },
    }));
  }, [inbox, onlineUsers]);

  const filteredByOnline = useMemo(() => {
    return allInbox.filter((item) => item.online?.());
  }, [allInbox]);

  const filteredByUnread = useMemo(() => {
    return allInbox.filter((item) => item?.unreadCount);
  }, [allInbox]);

  const filteredByGroup = useMemo(() => {
    return allInbox.filter((item) => item.type === "GROUP");
  }, [allInbox]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <SearchField value={query} onChange={setQuery} className="p-4" />
      <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit px-2 bg-transparent shrink-0">
          <TabsTrigger value="all" className="px-4 cursor-pointer rounded-full">
            All
          </TabsTrigger>
          <TabsTrigger
            value="online"
            className="px-4 cursor-pointer rounded-full"
          >
            Online
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="px-4 cursor-pointer rounded-full"
          >
            Unread
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="px-4 cursor-pointer rounded-full"
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
            isEmpty={!!!filteredByOnline.length}
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
            isEmpty={!!!filteredByUnread.length}
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
            isEmpty={!!!filteredByGroup.length}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
