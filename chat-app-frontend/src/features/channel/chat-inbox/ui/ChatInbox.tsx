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
  const { inbox, isLoading, isEmpty } = useInbox();
  const { onlineUsers, isOnline } = usePresence();
  useInboxUpdate();

  const [query, setQuery] = useState("");

  const allInbox = useMemo(() => {
    return inbox.map((item) => ({
      ...item,
      online: () => {
        if (item.type === "GROUP") {
          return item.channelMembers.some((member) => isOnline(member.user.id));
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
    <div className="w-full h-full">
      <SearchField
        value={query}
        onChange={setQuery}
        className="px-4 pb-6 pt-1"
      />

      <Tabs defaultValue="all" className="w-full h-full">
        <TabsList className="w-fit px-4 bg-transparent">
          <TabsTrigger value="all" className="px-8 cursor-pointer rounded-full">
            All
          </TabsTrigger>
          <TabsTrigger value="online" className="px-8 cursor-pointer">
            Online
          </TabsTrigger>
          <TabsTrigger value="unread" className="px-8 cursor-pointer">
            Unread
          </TabsTrigger>
          <TabsTrigger value="groups" className="px-8 cursor-pointer">
            Groups
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <ChatInboxResults
            results={allInbox}
            isLoading={isLoading}
            isEmpty={isEmpty}
          />
        </TabsContent>
        <TabsContent value="online">
          <ChatInboxResults
            results={filteredByOnline}
            isLoading={isLoading}
            isEmpty={!!!filteredByOnline.length}
          />
        </TabsContent>
        <TabsContent value="unread">
          <ChatInboxResults
            results={filteredByUnread}
            isLoading={isLoading}
            isEmpty={!!!filteredByUnread.length}
          />
        </TabsContent>
        <TabsContent value="groups">
          <ChatInboxResults
            results={filteredByGroup}
            isLoading={isLoading}
            isEmpty={!!!filteredByGroup.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
