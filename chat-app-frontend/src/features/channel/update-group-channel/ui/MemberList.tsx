import type { ConnectionUser } from "@/entities/connection";
import { Virtuoso } from "react-virtuoso";
import { LoaderCircle } from "lucide-react";
import { MemberListItem } from "./MemberListItem";

export function MemberList({
  users,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onToggleMember,
  selectedIds,
}: {
  users: ConnectionUser[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onToggleMember: (value: string) => void;
  selectedIds: string[];
}) {
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
              <LoaderCircle size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : null,
      }}
    />
  );
}
