import { Virtuoso } from "react-virtuoso";
import {
  MessageBubble,
  type Message,
  type NewMessage,
} from "@/entities/message";
import { useAuth } from "@/entities/auth";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useScrollToBottom } from "../model/useScrollToBottom";
import {
  useNewMessageAnimation,
  messageKey,
} from "../model/useNewMessageAnimation";

export interface MessagesProps {
  messages: (Message | NewMessage)[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function Messages({
  messages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: MessagesProps) {
  const { authUser } = useAuth();
  const { virtuosoRef, maxIndex } = useScrollToBottom({ messages });
  const { isNew, markAnimated } = useNewMessageAnimation(messages);

  // Dynamically calculate the starting index based on data size.
  // As 'messages' grows, firstItemIndex gets smaller, meaning the older
  // items cleanly expand backwards into negative relative index coordinates.
  const firstItemIndex = useMemo(
    () => maxIndex - messages.length,
    [messages.length, maxIndex],
  );

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{
        height: "100%",
        width: "100%",
      }}
      data={messages}
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
      itemContent={(_, message) => {
        const key = messageKey(message);
        return (
          <MessageBubble
            key={key}
            message={message}
            isAuthorsMessage={message.author.id === authUser?.id}
            animate={isNew(key)}
            onAnimationComplete={() => markAnimated(key)}
          />
        );
      }}
      components={{
        Header: () =>
          isFetchingNextPage ? (
            <div className="py-4 flex justify-center w-full">
              <CircleNotchIcon className="size-5 text-primary animate-spin" />
            </div>
          ) : null,
      }}
    />
  );
}
