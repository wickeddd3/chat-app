import { Virtuoso } from "react-virtuoso";
import {
  MessageBubble,
  type Message,
  type NewMessage,
} from "@/entities/message";
import { useAuth } from "@/entities/auth";
import { LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import { useScrollToBottom } from "../model/useScrollToBottom";

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
      itemContent={(_, message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isAuthorsMessage={message.author.id === authUser?.id}
        />
      )}
      components={{
        Header: () =>
          isFetchingNextPage ? (
            <div className="py-4 flex justify-center w-full">
              <LoaderCircle size={20} className="text-blue-500 animate-spin" />
            </div>
          ) : null,
      }}
    />
  );
}
