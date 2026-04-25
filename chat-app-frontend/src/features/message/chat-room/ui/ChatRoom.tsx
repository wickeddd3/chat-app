import { authClient } from "@/shared/lib/better-auth.client";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useWebSocketConnect } from "../model/useWebSocketConnect";
import { useChatRoom } from "../model/useChatRoom";

export function ChatRoom() {
  const { data: session, isPending } = authClient.useSession();
  const room = "myRoom";

  useWebSocketConnect(!!session);
  const { chatHistory } = useChatRoom(room);

  if (isPending) return <p>Loading session...</p>;

  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <div className="w-full p-4 rounded-t-lg font-bold">Live Chat: {room}</div>
      <div className="flex-1 w-full overflow-y-auto p-4 space-y-4">
        {chatHistory.map((content, i) => (
          <MessageBubble
            key={i}
            content={content}
            authId={session?.user?.id || ""}
          />
        ))}
      </div>
      <MessageInput room={room} />
    </div>
  );
}
