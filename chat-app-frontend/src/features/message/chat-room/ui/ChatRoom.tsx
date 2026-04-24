import { useEffect, useState } from "react";
import { authClient } from "@/shared/lib/better-auth.client";
import { webSocketClient } from "@/shared/lib/socket-io.client";

export function ChatRoom() {
  const { data: session, isPending } = authClient.useSession();
  console.log(session);
  const [room, setRoom] = useState("myRoom");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const sendMessage = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message !== "") {
      const messageData = {
        room,
        author: username,
        text: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      await webSocketClient.emit("send_message", messageData);
      setMessage("");
    }
  };

  useEffect(() => {
    // Join room on mount
    webSocketClient.emit("join_room", room);

    // Listen for incoming messages
    webSocketClient.on("receive_message", (data) => {
      console.log(data);
      setChatHistory((prev) => [...prev, data]);
    });

    // Cleanup to prevent duplicate listeners
    return () => {
      webSocketClient.off("receive_message");
    };
  }, [room]);

  useEffect(() => {
    // Only connect if the user is authenticated
    if (session) {
      webSocketClient.connect();

      webSocketClient.on("connect_error", (err) => {
        console.error("Auth failed on socket:", err.message);
      });

      return () => {
        webSocketClient.disconnect();
      };
    }
  }, [session]);

  if (isPending) return <p>Loading session...</p>;
  if (!session) return <p>Please log in to chat.</p>;

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <input
        type="text"
        placeholder="Set username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="max-w-md border p-2 rounded m-2"
      />
      <div className="max-w-md mx-auto mt-10 border rounded-lg shadow-lg bg-white">
        <div className="bg-blue-600 p-4 rounded-t-lg text-white font-bold">
          Live Chat: {room}
        </div>
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((content, i) => (
            <div
              key={i}
              className={`flex ${content.author?.name === username ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-2 rounded-lg ${content.author?.name === username ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              >
                <p className="text-xs opacity-75">{content.author?.name}</p>
                <p>{content.text}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border p-2 rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type here..."
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
