import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { Badge } from "@/shared/ui/shadcn/badge";
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

export function ContactList({ messageButton: MessageButton }: ContactListProps) {
  const [query, setQuery] = useState("");

  const { authUser } = useAuth();
  const {
    contacts,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useContacts(authUser?.id, query);

  const { isOnline } = usePresence();

  const allContacts = useMemo(() => {
    return contacts.map((item) => ({
      ...item,
      online: isOnline(item.id),
    }));
  }, [contacts, isOnline]);

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
        <TabsList className="w-fit px-4 bg-transparent shrink-0">
          <TabsTrigger value="all" className="px-4 cursor-pointer rounded-full">
            All
            <Badge className="border-4 py-2.5 rounded-full border-background bg-muted text-foreground font-bold">
              {allContacts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="online"
            className="px-4 cursor-pointer rounded-full"
          >
            Online
            <Badge className="border-4 py-2.5 rounded-full border-background bg-emerald-500 text-gray-50 font-bold">
              {filteredByOnline.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="all"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
        >
          <ContactResults
            results={allContacts}
            isLoading={isLoading}
            isEmpty={isEmpty}
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
