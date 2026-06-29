import { useChatRoom } from "../model/useChatRoom";
import { useMessages } from "../model/useMessages";
import { Messages } from "./Messages";
import { MessageInput } from "./MessageInput";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useAuth } from "@/app/store/AuthContext";

export function ChatRoom({ channelId }: { channelId: string }) {
  const { authUser } = useAuth();
  const {
    messages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(channelId, authUser?.id);

  useChatRoom(channelId);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full overflow-hidden">
      {/* Messages Viewport Container */}
      <div className="flex-1 min-h-0 w-full flex flex-col justify-center items-center overflow-hidden">
        {isLoading && <LoadingPlaceholder />}
        {!isLoading && !!messages.length && (
          <Messages
            messages={messages}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
        {!isLoading && !messages.length && <EmptyPlaceholder />}
      </div>
      <div className="w-full p-4">
        <MessageInput channelId={channelId} />
      </div>
    </div>
  );
}
