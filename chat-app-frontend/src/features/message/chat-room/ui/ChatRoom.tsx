import { useAuth } from "@/entities/auth";
import { MessageBubble } from "@/entities/message";
import { MessageInput } from "./MessageInput";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useChatRoom } from "../model/useChatRoom";
import { useMessages } from "../model/useMessages";

export function ChatRoom({ channelId }: { channelId: string }) {
  const { authId, authUser } = useAuth();
  // Fetch channel messages
  const { messages, isLoading } = useMessages(channelId);
  // Manage chat history and real-time updates
  const { chatHistory, setChatHistory } = useChatRoom(channelId, messages);

  return (
    <>
      <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto">
        {isLoading && <LoadingPlaceholder />}

        {!isLoading && !!chatHistory.length && (
          <div className="w-full h-full flex flex-col gap-2 p-4">
            {chatHistory.map((message, i) => (
              <MessageBubble key={i} message={message} authId={authId || ""} />
            ))}
          </div>
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
