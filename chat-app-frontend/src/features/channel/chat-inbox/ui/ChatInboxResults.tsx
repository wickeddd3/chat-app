import type { InboxChannel } from "@/entities/channel";
import { ChatInboxItem } from "./ChatInboxItem";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { Virtuoso } from "react-virtuoso";
import { Spinner } from "@/shared/ui/shadcn/spinner";

export function ChatInboxResults({
  isLoading = false,
  isEmpty = false,
  results,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  isLoading?: boolean;
  isEmpty?: boolean;
  results: InboxChannel[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  return (
    <div className="flex-1 h-full overflow-y-auto min-h-0 scrollbar-thin flex flex-col">
      {isLoading && <LoadingPlaceholder />}

      {!isEmpty && (
        <Virtuoso
          style={{
            height: "100%",
            width: "100%",
          }}
          totalCount={results.length}
          data={results}
          overscan={400}
          endReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          itemContent={(_, inboxItem) => (
            <ChatInboxItem key={inboxItem.id} inboxItem={inboxItem} />
          )}
          components={{
            Footer: () =>
              isFetchingNextPage ? (
                <div className="py-4 flex justify-center">
                  <Spinner />
                </div>
              ) : null,
          }}
        />
      )}

      {isEmpty && <EmptyPlaceholder />}
    </div>
  );
}
