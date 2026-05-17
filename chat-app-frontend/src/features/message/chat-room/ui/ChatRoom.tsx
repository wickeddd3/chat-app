import { useAuth } from "@/entities/auth";
import { MessageBubble } from "@/entities/message";
import { MessageInput } from "./MessageInput";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useChatRoom } from "../model/useChatRoom";
import { useMessages } from "../model/useMessages";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";

export function ChatRoom({ channelId }: { channelId: string }) {
  const { authId, authUser } = useAuth();

  // Fetch channel messages
  const {
    messages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(channelId);

  // Manage chat history and real-time updates
  const { chatHistory, setChatHistory } = useChatRoom(channelId, messages);

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Establish a massive max boundary for virtual index layout calculations
  const MAX_INDEX = 50000;
  // Dynamically calculate the starting index based on data size.
  // As 'messages' grows, firstItemIndex gets smaller, meaning the older
  // items cleanly expand backwards into negative relative index coordinates.
  const firstItemIndex = MAX_INDEX - chatHistory.length;

  useEffect(() => {
    // Keep tracking new messages as they arrive in real-time
    if (chatHistory.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: chatHistory.length - 1,
        behavior: "smooth",
      });
    }
  }, [chatHistory.length]);

  return (
    <>
      <div className="flex-1 min-h-0 w-full flex flex-col justify-center items-center overflow-hidden">
        {isLoading && <LoadingPlaceholder />}

        {!isLoading && !!chatHistory.length && (
          <Virtuoso
            ref={virtuosoRef}
            style={{
              height: "100%",
              width: "100%",
            }}
            totalCount={chatHistory.length}
            data={chatHistory}
            // Starts the view container at the bottom item on mount/refresh
            // Context-aware anchors for scrolling up
            firstItemIndex={firstItemIndex}
            initialTopMostItemIndex={MAX_INDEX - 1}
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
                authId={authId || ""}
              />
            )}
            components={{
              Header: () =>
                isFetchingNextPage ? (
                  <div className="py-4 flex justify-center w-full">
                    <LoaderCircle
                      size={20}
                      className="text-blue-500 animate-spin"
                    />
                  </div>
                ) : null,
            }}
          />
        )}

        {!isLoading && !!!chatHistory.length && <EmptyPlaceholder />}
      </div>
      <div className="w-full p-4">
        <MessageInput
          channelId={channelId}
          author={authUser}
          onMessageSent={(message) =>
            setChatHistory((prev) => [...prev, message])
          }
        />
      </div>
    </>
  );
}
