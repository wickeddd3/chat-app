import { useChatRoom } from "../model/useChatRoom";
import { useReplyTarget } from "../model/useReplyTarget";
import { useImageAttachment } from "../model/useImageAttachment";
import { useSendMessage } from "../model/useSendMessage";
import { useMessages } from "../model/useMessages";
import { Messages } from "./Messages";
import { MessageInput } from "./MessageInput";
import { MessagingClosedNotice } from "./MessagingClosedNotice";
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

  const { replyTarget, replyTo, cancelReply } = useReplyTarget(channelId);
  const { attachment, attachImage, clearAttachment, takeAttachment } =
    useImageAttachment(channelId);

  // The send lives here rather than in the composer: the timeline needs it too,
  // to retry a photo whose upload failed.
  const { message, setMessage, sendMessage, retryUpload } = useSendMessage({
    channelId,
    replyTarget,
    takeAttachment,
    onSent: cancelReply,
  });

  useChatRoom(channelId);

  // Only a removed contact closes a thread, and only the details endpoint reports
  // it — an undefined flag (or a channel still loading) means "open", so the
  // composer never flickers into a notice while the fetch settles.
  const isClosed = channel?.canMessage === false;

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
            // A closed thread takes no new messages, so it takes no replies
            // either — without the handler the bubbles show no affordance.
            {...(!isClosed && { onReply: replyTo })}
            onRetryUpload={retryUpload}
          />
        )}
        {!isLoading && !messages.length && <EmptyPlaceholder />}
      </div>
      {!isClosed && <TypingIndicator channelId={channelId} />}

      <div className="w-full p-4">
        {isClosed ? (
          <MessagingClosedNotice recipientName={channel?.recipient?.name} />
        ) : (
          <MessageInput
            channelId={channelId}
            message={message}
            onMessageChange={setMessage}
            onSubmit={sendMessage}
            replyTarget={replyTarget}
            isOwnReplyTarget={replyTarget?.author.id === authUser?.id}
            onCancelReply={cancelReply}
            attachment={attachment}
            onAttachImage={(file) => void attachImage(file)}
            onRemoveAttachment={clearAttachment}
          />
        )}
      </div>
    </div>
  );
}
