import { SearchField } from "@/shared/ui/SearchField";
import { useUsers } from "../model/useUsers";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { UserListItem } from "./UserListItem";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { LoaderCircle } from "lucide-react";

export function UserList({
  sendConnectionButton: SendConnectionButton,
}: {
  sendConnectionButton: React.ComponentType<{
    text: string;
    receiverId: string;
  }>;
}) {
  const [query, setQuery] = useState("");

  const {
    users,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useUsers(query);

  return (
    <div className="flex-1 flex flex-col border-r h-full min-h-0">
      <div className="p-4 shrink-0">
        <h1 className="text-base font-medium text-foreground">
          People you can message
        </h1>
      </div>
      <div className="shrink-0">
        <SearchField
          value={query}
          onChange={setQuery}
          className="px-4 pb-6 pt-1"
        />
      </div>
      <div className="flex-1 w-full overflow-hidden relative">
        {isLoading && <LoadingPlaceholder />}

        {!isEmpty && (
          <Virtuoso
            style={{
              height: "100%",
              width: "100%",
            }}
            data={users}
            overscan={400}
            endReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            itemContent={(_, user) => (
              <UserListItem
                key={user.id}
                user={user}
                optionSlot={
                  <SendConnectionButton
                    text="Add Contact"
                    receiverId={user.id}
                  />
                }
              />
            )}
            components={{
              Footer: () =>
                isFetchingNextPage ? (
                  <div className="py-4 flex justify-center">
                    <LoaderCircle
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
    </div>
  );
}
