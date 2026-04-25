import { Send } from "lucide-react";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useState } from "react";

export function MessageInput({ room }: { room: string }) {
  const [message, setMessage] = useState("");

  const sendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message !== "") {
      const messageData = {
        room,
        text: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      webSocketClient.emit("send_message", messageData);
      setMessage("");
    }
  };

  return (
    <form onSubmit={sendMessage} className="w-full flex gap-2">
      <input
        className="flex-1 border p-4 rounded border-none outline-0"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type here..."
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
