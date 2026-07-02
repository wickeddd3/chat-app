import type { ConnectionUser } from "../model/connection.types";
import { Virtuoso } from "react-virtuoso";
import { FaCircleNotch } from "react-icons/fa6";
import { MemberListItem } from "./MemberListItem";

export interface MemberListProps {
  users: ConnectionUser[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onToggleMember: (value: string) => void;
  selectedIds: string[];
}

export function MemberList({
  users,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onToggleMember,
  selectedIds,
}: MemberListProps) {
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
              <FaCircleNotch size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : null,
      }}
    />
  );
}
