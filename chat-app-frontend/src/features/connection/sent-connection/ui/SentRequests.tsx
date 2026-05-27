import { ConnectionItem } from "@/entities/connection";
import { useSentConnectionRequests } from "../model/useSentConnectionRequests";
import { LoaderCircleIcon } from "lucide-react";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { Virtuoso } from "react-virtuoso";
import { dateToNow } from "@/shared/utils/date-format";

export function SentRequests({
  cancelButton: CancelButton,
}: {
  cancelButton: React.ComponentType<{
    text: string;
    connectionRequestId: string;
  }>;
}) {
  const {
    sentRequests,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSentConnectionRequests();

  return (
    <div className="flex-1 h-full overflow-y-auto min-h-0 scrollbar-thin">
      {isLoading && <LoadingPlaceholder />}

      {!isEmpty && (
        <Virtuoso
          style={{
            height: "100%",
            width: "100%",
          }}
          data={sentRequests}
          overscan={400}
          endReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          itemContent={(_, request) => (
            <ConnectionItem
              key={request.id}
              user={request.user}
              date={dateToNow(request.createdAt)}
              optionSlot={
                <CancelButton
                  text="Cancel Request"
                  connectionRequestId={request.id}
                />
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
  );
}
