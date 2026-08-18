import { CircleNotchIcon } from "@phosphor-icons/react";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { Virtuoso } from "react-virtuoso";
import { isLessThanADayOld } from "@/shared/utils/date-format";
import type { ConnectionUser } from "@/entities/connection";
import { UserListItem } from "@/entities/user";

export interface ContactResultsProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  /** The active search, so an empty list can say why it is empty. */
  searchQuery?: string;
  results: (ConnectionUser & { online: boolean; lastSeenText?: string })[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  messageButton: React.ComponentType<{
    text: string;
    targetUserId: string;
  }>;
  /**
   * Optional per-row action rendered beside "Message" (contact removal). Injected
   * from the page so this slice stays free of feature-to-feature imports.
   */
  contactAction?: React.ComponentType<{
    targetUserId: string;
    targetName?: string;
  }>;
}

export function ContactResults({
  isLoading = false,
  isEmpty = false,
  searchQuery,
  results,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  messageButton: MessageButton,
  contactAction: ContactAction,
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
              date={contact?.lastSeenText}
              optionSlot={
                <>
                  <MessageButton text="Message" targetUserId={contact.id} />
                  {ContactAction && (
                    <ContactAction
                      targetUserId={contact.id}
                      targetName={contact.name}
                    />
                  )}
                </>
              }
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
      )}

      {isEmpty && <EmptyPlaceholder searchQuery={searchQuery} />}
    </div>
  );
}
