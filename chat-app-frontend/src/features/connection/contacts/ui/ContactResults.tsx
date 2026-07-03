import { FaCircleNotch } from "react-icons/fa6";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { Virtuoso } from "react-virtuoso";
import { isLessThanADayOld } from "@/shared/utils/date-format";
import type { ConnectionUser } from "@/entities/connection";
import { UserListItem } from "@/entities/user";

export interface ContactResultsProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  results: (ConnectionUser & { online: boolean })[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  messageButton: React.ComponentType<{
    text: string;
    targetUserId: string;
  }>;
}

export function ContactResults({
  isLoading = false,
  isEmpty = false,
  results,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  messageButton: MessageButton,
}: ContactResultsProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto min-h-0 scrollbar-thin">
      {isLoading && <LoadingPlaceholder />}

      {!isEmpty && (
        <Virtuoso
          style={{
            height: "100%",
            width: "100%",
          }}
          data={results}
          overscan={400}
          endReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          itemContent={(_, contact) => (
            <UserListItem
              key={contact.id}
              user={{
                name: contact.name,
                username: contact.username,
                image: contact.image,
              }}
              isNew={isLessThanADayOld(contact?.updatedAt || "")}
              isOnline={contact?.online}
              optionSlot={
                <MessageButton text="Message" targetUserId={contact.id} />
              }
            />
          )}
          components={{
            Footer: () =>
              isFetchingNextPage ? (
                <div className="py-4 flex justify-center">
                  <FaCircleNotch
                    size={20}
                    className="text-primary animate-spin"
                  />
                </div>
              ) : null,
          }}
        />
      )}

      {isEmpty && <EmptyPlaceholder />}
    </div>
  );
}
