import { Virtuoso } from "react-virtuoso";
import { NotificationItem } from "./NotificationItem";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoaderCircle } from "lucide-react";
import type { Notification } from "@/entities/notification";

export function NotificationResults({
  isLoading = false,
  isEmpty = false,
  results,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onClick,
}: {
  isLoading?: boolean;
  isEmpty?: boolean;
  results: Notification[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onClick: (notificationIds: string[]) => void;
}) {
  return (
    <div className="flex-1 w-full overflow-hidden relative">
      {isLoading && <LoadingPlaceholder />}

      {!isLoading && !isEmpty && (
        <Virtuoso
          style={{ height: "100%", width: "100%" }}
          data={results}
          overscan={300}
          endReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          itemContent={(_, notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => onClick([notification.id])}
            />
          )}
          components={{
            Footer: () =>
              isFetchingNextPage ? (
                <div className="py-4 flex justify-center w-full">
                  <LoaderCircle
                    size={20}
                    className="text-primary animate-spin"
                  />
                </div>
              ) : null,
          }}
        />
      )}

      {!isLoading && isEmpty && <EmptyPlaceholder />}
    </div>
  );
}
