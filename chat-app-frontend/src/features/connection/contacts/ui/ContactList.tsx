import { Tabs, TabsContent } from "@/shared/ui/shadcn/tabs";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
  SegmentedTabBadge,
} from "@/shared/ui/SegmentedTabs";
import { SearchField } from "@/shared/ui/SearchField";
import { useMemo, useState } from "react";
import { ContactResults } from "./ContactResults";
import { useAuth, usePresence } from "@/entities/auth";
import { useContacts } from "@/entities/connection";

export interface ContactListProps {
  messageButton: React.ComponentType<{
    text: string;
    targetUserId: string;
  }>;
}

export function ContactList({
  messageButton: MessageButton,
}: ContactListProps) {
  const [query, setQuery] = useState("");

  const { authUser } = useAuth();
  const {
    contacts,
    isLoading,
    isEmpty,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    appliedQuery,
  } = useContacts(authUser?.id, query);

  const { isOnline } = usePresence();

  const allContacts = useMemo(() => {
    return contacts.map((item) => ({
      ...item,
      online: isOnline(item.id),
    }));
  }, [contacts, isOnline]);

  // Online has no server-side equivalent — presence lives in Redis and is pushed
  // to the client live — so this stays derived from the loaded pages. It trades
  // exactness for instant updates when someone connects or disconnects.
  const filteredByOnline = useMemo(() => {
    return allContacts.filter((item) => item.online);
  }, [allContacts]);

  return (
    <>
      <SearchField
        value={query}
        onChange={setQuery}
        className="px-4 pb-6 pt-1"
      />
      <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
        <SegmentedTabsList className="mx-4 shrink-0">
          <SegmentedTabsTrigger value="all">
            All
            <SegmentedTabBadge>{total}</SegmentedTabBadge>
          </SegmentedTabsTrigger>
          <SegmentedTabsTrigger value="online">
            Online
            {/* Online is a status, not a total, so it keeps a hue of its own
                rather than promoting to the brand colour when active. */}
            <SegmentedTabBadge className="group-data-active/tab:bg-emerald-600">
              {filteredByOnline.length}
            </SegmentedTabBadge>
          </SegmentedTabsTrigger>
        </SegmentedTabsList>
        <TabsContent
          value="all"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ContactResults
            results={allContacts}
            isLoading={isLoading}
            isEmpty={isEmpty}
            searchQuery={appliedQuery}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            messageButton={MessageButton}
          />
        </TabsContent>
        <TabsContent
          value="online"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ContactResults
            results={filteredByOnline}
            isLoading={isLoading}
            isEmpty={!filteredByOnline.length}
            searchQuery={appliedQuery}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            messageButton={MessageButton}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
