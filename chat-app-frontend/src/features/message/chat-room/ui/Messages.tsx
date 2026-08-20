import { Virtuoso } from "react-virtuoso";
import {
  MessageBubble,
  DayDivider,
  SystemMessage,
  groupMessages,
  isSystemMessage,
  type Message,
  type NewMessage,
} from "@/entities/message";
import { useAuth } from "@/entities/auth";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { Components } from "react-virtuoso";
import type { GroupedMessage } from "@/entities/message";
import { useScrollToBottom } from "../model/useScrollToBottom";
import {
  useNewMessageAnimation,
  messageKey,
} from "../model/useNewMessageAnimation";
import { useJumpToMessage } from "../model/useJumpToMessage";

export interface MessagesProps {
  messages: (Message | NewMessage)[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** Name the author on incoming runs — only meaningful in a group channel. */
  showAuthorNames?: boolean;
  /**
   * Stages a message as the composer's reply target. Omitted when the thread is
   * closed to new messages, which is what hides the affordance.
   */
  onReply?: (message: Message | NewMessage) => void;
  /** Retries a photo upload that failed, by the message's client id. */
  onRetryUpload?: (clientId: string) => void;
}

export function Messages({
  messages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  showAuthorNames = false,
  onReply,
  onRetryUpload,
}: MessagesProps) {
  const { authUser } = useAuth();
  const { virtuosoRef, maxIndex } = useScrollToBottom({ messages });
  const { isNew, markAnimated } = useNewMessageAnimation(messages);

  // Each row needs to know its neighbours to render as part of a run, and
  // Virtuoso's item index is offset by `firstItemIndex` — so the run position
  // travels with the item rather than being derived from the index.
  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);

  // Dynamically calculate the starting index based on data size.
  // As 'messages' grows, firstItemIndex gets smaller, meaning the older
  // items cleanly expand backwards into negative relative index coordinates.
  const firstItemIndex = useMemo(
    () => maxIndex - messages.length,
    [messages.length, maxIndex],
  );

  const { jumpToMessage, highlightedId } = useJumpToMessage({
    messages,
    virtuosoRef,
    firstItemIndex,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Stable across renders so Virtuoso doesn't remount the loading header (which
  // would restart the spinner); only its identity would otherwise change.
  const components = useMemo<Components<GroupedMessage>>(
    () => ({
      Header: () =>
        isFetchingNextPage ? (
          <div className="py-4 flex justify-center w-full">
            <CircleNotchIcon className="size-5 text-primary animate-spin" />
          </div>
        ) : null,
    }),
    [isFetchingNextPage],
  );

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{
        height: "100%",
        width: "100%",
      }}
      data={groupedMessages}
      // Starts the view container at the bottom item on mount/refresh
      // Context-aware anchors for scrolling up
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={maxIndex - 1}
      // Ensures that if the user stays at the bottom,
      // new incoming messages push the view down smoothly
      followOutput="smooth"
      // Fired automatically when user scrolls near the top of the chat room
      startReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      itemContent={(_, { message, position, startsDay }) => {
        const key = messageKey(message);
        return (
          // The divider rides along with the day's first message rather than
          // being its own row, so the list stays one item per message — the
          // `firstItemIndex` arithmetic above counts on that.
          <div key={key}>
            {startsDay && <DayDivider date={message.createdAt} />}
            {isSystemMessage(message) ? (
              // Narration, not correspondence — it gets no bubble, no side and
              // no delivery state.
              <SystemMessage content={message.content} />
            ) : (
              <MessageBubble
                message={message}
                isAuthorsMessage={message.author.id === authUser?.id}
                quotesOwnMessage={message.parent?.author.id === authUser?.id}
                isHighlighted={!!message.id && message.id === highlightedId}
                {...(onReply && { onReply })}
                onJumpToParent={jumpToMessage}
                {...(onRetryUpload && { onRetryUpload })}
                position={position}
                showAuthorName={showAuthorNames}
                animate={isNew(key)}
                // `markAnimated` is referentially stable, so the memoized bubble
                // keeps skipping re-renders as the list around it churns.
                messageKey={key}
                onAnimated={markAnimated}
              />
            )}
          </div>
        );
      }}
      components={components}
    />
  );
}
