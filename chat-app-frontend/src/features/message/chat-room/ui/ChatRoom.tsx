import { useParams } from "react-router";
import { useUserByUsername } from "@/entities/user";
import { authClient } from "@/shared/lib/better-auth.client";
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

  // Get session and roomId from URL
  const { data: session, isPending } = authClient.useSession();
  const authUserId = session?.user?.id || "";

  // 1. Resolve the username to get the target user's ID
  const { data: targetUser } = useUserByUsername(username);

  // 2. Generate a private roomId based on targetUser ID and authUser ID
  const roomId = generatePrivateRoomId(targetUser?.id || "", authUserId);

  // 3. Establish WebSocket connection when roomID is ready
  useWebSocketConnect(!!roomId);

  // Manage chat history and real-time updates
  const { chatHistory, setChatHistory, isLoading } = useChatRoom(roomId || "");

  if (isPending) return <p>Loading session...</p>;

  return (
    <div className="flex-1 flex flex-col">
      <MessageHeader user={targetUser} />
      <div className="flex-1 w-full overflow-y-auto flex flex-col justify-center items-center">
        {isLoading && <LoadingPlaceholder />}

        {!isLoading && !!chatHistory.length && (
          <div className="w-full h-full flex flex-col gap-2 p-4">
            {chatHistory.map((message, i) => (
              <MessageBubble key={i} message={message} authId={authUserId} />
            ))}
          </div>
        )}

        {!isLoading && !!!chatHistory.length && <EmptyPlaceholder />}
      </div>
      <div className="w-full p-4">
        <MessageInput
          roomId={roomId || ""}
          author={session?.user}
          onMessageSent={(message) =>
            setChatHistory((prev) => [...prev, message])
          }
        />
      </div>
    </div>
  );
}
