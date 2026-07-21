import { useChatRoom } from "../model/useChatRoom";
import { useMessages } from "../model/useMessages";
import { Messages } from "./Messages";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useAuth } from "@/entities/auth";
import { useChannel } from "@/entities/channel";

export interface ChatRoomProps {
  channelId: string;
}

export function ChatRoom({ channelId }: ChatRoomProps) {
  const { authUser } = useAuth();
  // Already fetched by the page around us — this resolves from cache.
  const { channel } = useChannel(channelId, authUser?.id);
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
            // A direct thread has one other person, already named in the
            // header — only a group needs each run attributed.
            showAuthorNames={channel?.type === "GROUP"}
          />
        )}
        {!isLoading && !messages.length && <EmptyPlaceholder />}
      </div>
      <TypingIndicator channelId={channelId} />

      <div className="w-full p-4">
        <MessageInput channelId={channelId} />
      </div>
    </div>
  );
}
