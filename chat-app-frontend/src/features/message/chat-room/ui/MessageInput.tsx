import { useRef } from "react";
import { FaPaperPlane } from "react-icons/fa6";
import { EmojiPicker } from "@/shared/ui/emoji-picker/EmojiPicker";
import { useSendMessage } from "../model/useSendMessage";

export interface MessageInputProps {
  channelId: string;
}

export function MessageInput({ channelId }: MessageInputProps) {
  const { message, setMessage, sendMessage } = useSendMessage({ channelId });
  const inputRef = useRef<HTMLInputElement>(null);

  // Insert at the caret (text inputs retain selectionStart while blurred, so the
  // picker can stay open); fall back to appending when the input was never focused.
  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? message.length;
    const end = input?.selectionEnd ?? start;

    setMessage(message.slice(0, start) + emoji + message.slice(end));

    const caret = start + emoji.length;
    requestAnimationFrame(() => {
      input?.setSelectionRange(caret, caret);
    });
  };

  return (
    <form
      onSubmit={sendMessage}
      className="w-full flex items-center gap-2 bg-muted rounded-full"
    >
      <label htmlFor="message-input" className="sr-only">
        Message
      </label>
      <input
        id="message-input"
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type here"
        className="flex-1 border p-4 border-none outline-0 placeholder:text-sm"
      />
      <EmojiPicker onSelect={insertEmoji} />
      <button
        type="submit"
        aria-label="Send message"
        className="text-primary px-4 rounded-full cursor-pointer hover:text-primary"
      >
        <FaPaperPlane className="size-6" />
      </button>
    </form>
  );
}
