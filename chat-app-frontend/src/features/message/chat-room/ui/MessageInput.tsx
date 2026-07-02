import { SendIcon } from "lucide-react";
import { useSendMessage } from "../model/useSendMessage";

export interface MessageInputProps {
  channelId: string;
}

export function MessageInput({ channelId }: MessageInputProps) {
  const { message, setMessage, sendMessage } = useSendMessage({ channelId });

  return (
    <form
      onSubmit={sendMessage}
      className="w-full flex gap-2 bg-gray-100 rounded-full"
    >
      <label htmlFor="message-input" className="sr-only">
        Message
      </label>
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
        aria-label="Send message"
        className="text-blue-500 px-4 rounded-full cursor-pointer hover:text-blue-700"
      >
        <SendIcon />
      </button>
    </form>
  );
}
