import { ConnectionItem } from "@/entities/connection";
import { useContacts } from "../model/useContacts";
import { LoaderCircleIcon } from "lucide-react";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { SearchField } from "@/shared/ui/SearchField";
import { Virtuoso } from "react-virtuoso";
import { useState } from "react";

export function ContactList({
  messageButton: MessageButton,
}: {
  messageButton: React.ComponentType<{
    text: string;
    targetUserId: string;
  }>;
}) {
  const [query, setQuery] = useState("");

  const {
    contacts,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useContacts(query);

  return (
    <>
      <SearchField value={query} onChange={setQuery} className="p-4" />
      <div className="flex-1 h-full overflow-y-auto min-h-0 scrollbar-thin">
        {isLoading && <LoadingPlaceholder />}

        {!isEmpty && (
          <Virtuoso
            style={{
              height: "100%",
              width: "100%",
            }}
            data={contacts}
            overscan={400}
            endReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            itemContent={(_, contact) => (
              <ConnectionItem
                key={contact.id}
                user={{
                  name: contact.name,
                  username: contact.username,
                  image: contact.image,
                }}
                optionSlot={
                  <MessageButton text="Message" targetUserId={contact.id} />
                }
              />
            )}
            components={{
              Footer: () =>
                isFetchingNextPage ? (
                  <div className="py-4 flex justify-center">
                    <LoaderCircleIcon
                      size={20}
                      className="text-blue-500 animate-spin"
                    />
                  </div>
                ) : null,
            }}
          />
        )}

        {isEmpty && <EmptyPlaceholder />}
      </div>
    </>
  );
}
