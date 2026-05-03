import { useParams } from "react-router";
import { useAuth } from "@/entities/auth";
import { useUserByUsername } from "@/entities/user";
import { useChatRoom } from "../model/useChatRoom";
import { MessageHeader } from "./MessageHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { useChannel } from "@/entities/channel";
import { useMessages } from "../model/useMessages";

export function ChatRoom() {
  const { username } = useParams();
  const { authId, authUser, isAuthPending } = useAuth();

  // 1. Fetch target user's data based on username param
  const { data: targetUser } = useUserByUsername(username);

  // 2. Check if auth user and target user has an existing channel.
  // Backend will create a channel if no existing channel, otherwise proceed
  const { data: channel } = useChannel(targetUser?.id || "");

  // 3. Fetch channel messages
  const { messages, isLoading } = useMessages(channel?.id || "");

  // 4. Manage chat history and real-time updates
  const { chatHistory, setChatHistory } = useChatRoom(
    channel?.id || "",
    messages,
  );

  if (isAuthPending) return <p>Loading session...</p>;

  return (
    <div className="flex-1 flex flex-col">
      <MessageHeader user={targetUser} />
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
