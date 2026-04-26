import { authClient } from "@/shared/lib/better-auth.client";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useWebSocketConnect } from "../model/useWebSocketConnect";
import { useChatRoom } from "../model/useChatRoom";
import { useParams } from "react-router";

export function ChatRoom() {
  // Get session and roomId from URL
  const { data: session, isPending } = authClient.useSession();
  const { roomId } = useParams();

  // Establish WebSocket connection when session is ready
  useWebSocketConnect(!!session);

  // Manage chat history and real-time updates
  const { chatHistory, setChatHistory } = useChatRoom(roomId || "");

  if (isPending) return <p>Loading session...</p>;

  return (
    <div className="flex-1 flex flex-col justify-center items-center pb-4">
      <div className="w-full rounded-t-lg text-xs font-bold py-5 px-4">
        Live Chat: {roomId}
      </div>
      <div className="flex-1 w-full overflow-y-auto space-y-4 p-4">
        {chatHistory.map((message, i) => (
          <MessageBubble
            key={i}
            message={message}
            authId={session?.user?.id || ""}
          />
        ))}
      </div>
      <div className="px-4 w-full">
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
