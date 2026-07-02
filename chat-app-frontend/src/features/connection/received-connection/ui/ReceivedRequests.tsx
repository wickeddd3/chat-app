import { useReceivedConnectionRequests } from "../model/useReceivedConnectionRequests";
import { LoaderCircleIcon } from "lucide-react";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { Virtuoso } from "react-virtuoso";
import { dateToNow } from "@/shared/utils/date-format";
import { useAuth } from "@/entities/auth";
import { UserListItem } from "@/entities/user";

export function ReceivedRequests({
  acceptButton: AcceptButton,
  declineButton: DeclineButton,
}: {
  acceptButton: React.ComponentType<{
    text: string;
    connectionRequestId: string;
  }>;
  declineButton: React.ComponentType<{
    text: string;
    connectionRequestId: string;
    connectionRequestUserId: string;
  }>;
}) {
  const { authUser } = useAuth();
  const {
    receivedRequests,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useReceivedConnectionRequests(authUser?.id);

  return (
    <div className="flex-1 h-full overflow-y-auto min-h-0 scrollbar-thin">
      {isLoading && <LoadingPlaceholder />}

      {!isEmpty && (
        <Virtuoso
          style={{
            height: "100%",
            width: "100%",
          }}
          data={receivedRequests}
          overscan={400}
          endReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          itemContent={(_, request) => (
            <UserListItem
              key={request.id}
              user={request.user}
              date={dateToNow(request.createdAt)}
              optionSlot={
                <>
                  <DeclineButton
                    text="Decline Request"
                    connectionRequestId={request.id}
                    connectionRequestUserId={request.user.id}
                  />
                  <AcceptButton
                    text="Accept Request"
                    connectionRequestId={request.id}
                  />
                </>
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
