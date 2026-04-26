import { Send } from "lucide-react";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useState } from "react";

export function MessageInput({
  roomId,
  author,
  onMessageSent,
}: {
  roomId: string;
  author?: Partial<{
    id: string;
    name: string;
    image: string | null;
  }>;
  onMessageSent: (message: any) => void;
}) {
  const [message, setMessage] = useState("");

  const sendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (message.trim() === "") return;

    // 1. Generate a temporary unique ID
    const clientId = window.crypto.randomUUID();

    // 2. Create the message object with optimistic data
    const messageData = {
      clientId,
      roomId,
      content: message,
      author: {
        id: author?.id,
        name: author?.name,
        image: author?.image,
      },
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSending: true,
    };

    // 3. Update UI immediately
    onMessageSent(messageData);

    // 4. Send to server
    webSocketClient.emit("send_message", {
      roomId,
      content: message,
      clientId,
    });
    setMessage("");
  };

  return (
    <form
      onSubmit={sendMessage}
      className="w-full flex gap-2 bg-gray-100 rounded-full"
    >
      <input
        id="message-input"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type here"
        className="flex-1 border p-4 border-none outline-0 placeholder:text-sm"
      />
      <button
        type="submit"
        className="text-blue-500 px-4 rounded-full cursor-pointer hover:text-blue-700"
      >
        <Send />
      </button>
    </form>
  );
}
