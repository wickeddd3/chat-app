import { useParams } from "react-router";
import { useAuth } from "@/entities/auth";
// import { useUserByUsername } from "@/entities/user";
import { useChatRoom } from "../model/useChatRoom";
import { MessageHeader } from "./MessageHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useChannel } from "@/entities/channel";
import { useMessages } from "../model/useMessages";

export function ChatRoom() {
  const { channelId } = useParams();
  const { authId, authUser } = useAuth();

  // 1. Fetch channel details based on channelId param
  const { channel } = useChannel(channelId || "");

  // 2. Fetch channel messages
  const { messages, isLoading } = useMessages(channel?.id || "");

  // 3. Manage chat history and real-time updates
  const { chatHistory, setChatHistory } = useChatRoom(
    channel?.id || "",
    messages,
  );

  return (
    <div className="flex-1 flex flex-col">
      <MessageHeader channel={channel} authId={authId || ""} />
      <div className="flex-1 w-full overflow-y-auto flex flex-col justify-center items-center">
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
          channelId={channel?.id || ""}
          author={authUser}
          onMessageSent={(message) =>
            setChatHistory((prev) => [...prev, message])
          }
        />
      </div>
    </div>
  );
}
