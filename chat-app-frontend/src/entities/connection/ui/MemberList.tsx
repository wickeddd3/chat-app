import type { ConnectionUser } from "../model/connection.types";
import { Virtuoso } from "react-virtuoso";
import { AddressBookIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { MemberListItem } from "./MemberListItem";
import { ListEmptyState } from "@/shared/ui/ListEmptyState";
import { NoSearchResults } from "@/shared/ui/NoSearchResults";

export interface MemberListProps {
  users: ConnectionUser[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onToggleMember: (value: string) => void;
  selectedIds: string[];
  isLoading?: boolean;
  /** The applied search, so an empty list can say why it is empty. */
  searchQuery?: string;
}

export function MemberList({
  users,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onToggleMember,
  selectedIds,
  isLoading = false,
  searchQuery = "",
}: MemberListProps) {
  if (isLoading && users.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircleNotchIcon className="size-5 text-primary animate-spin" />
        <span className="sr-only">Loading contacts</span>
      </div>
    );
  }

  if (users.length === 0) {
    // Same split as the inbox and people lists: a search that found nobody is a
    // different situation from having no contacts at all.
    return searchQuery ? (
      <NoSearchResults query={searchQuery} noun="contacts" size="panel" />
    ) : (
      <ListEmptyState
        size="panel"
        icon={AddressBookIcon}
        title="No contacts yet"
        description="Add contacts first — you can only invite people you are connected to."
      />
    );
  }

  return (
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
        <MemberListItem
          key={user.id}
          user={user}
          onToggleMember={onToggleMember}
          selectedIds={selectedIds}
        />
      )}
      components={{
        Footer: () =>
          isFetchingNextPage ? (
            <div className="py-4 flex justify-center">
              <CircleNotchIcon className="size-5 text-primary animate-spin" />
            </div>
          ) : null,
      }}
    />
  );
}
