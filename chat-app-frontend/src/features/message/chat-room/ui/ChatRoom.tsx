import { useParams } from "react-router";
import { useAuth } from "@/entities/auth";
import { useUserByUsername } from "@/entities/user";
import { generatePrivateRoomId } from "@/shared/utils/generate-room-id";
import { useWebSocketConnect } from "../model/useWebSocketConnect";
import { useChatRoom } from "../model/useChatRoom";
import { MessageHeader } from "./MessageHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export function ChatRoom() {
  const { username } = useParams();
  const { authId, authUser, isAuthPending } = useAuth();

  // 1. Resolve the username to get the target user's ID
  const { data: targetUser } = useUserByUsername(username);

  // 2. Generate a private roomId based on targetUser ID and authUser ID
  const roomId = generatePrivateRoomId(targetUser?.id || "", authId || "");

  // 3. Establish WebSocket connection when roomID is ready
  useWebSocketConnect(!!roomId);

  // Manage chat history and real-time updates
  const { chatHistory, setChatHistory, isLoading } = useChatRoom(roomId || "");

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
          roomId={roomId || ""}
          author={authUser}
          onMessageSent={(message) =>
            setChatHistory((prev) => [...prev, message])
          }
        />
      </div>
    </div>
  );
}
