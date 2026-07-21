import { useRef } from "react";
import { PaperPlaneRightIcon } from "@phosphor-icons/react";
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

  // The hook already refuses blank sends; mirroring it here means the button
  // shows that state rather than looking live and doing nothing.
  const canSend = message.trim().length > 0;

  return (
    <form
      onSubmit={sendMessage}
      className="flex w-full items-center gap-1 rounded-full border border-transparent bg-muted p-1.5 transition-colors focus-within:border-ring focus-within:bg-card focus-within:ring-[3px] focus-within:ring-ring/25"
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
        placeholder="Type a message"
        // The ring sits on the form, so the field stays outline-free without
        // losing the focus indicator the way a bare `outline-0` did.
        className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
      />

      <EmojiPicker onSelect={insertEmoji} />

      <button
        type="submit"
        aria-label="Send message"
        disabled={!canSend}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-foreground/10 disabled:text-muted-foreground"
      >
        <PaperPlaneRightIcon weight="fill" className="size-4" />
      </button>
    </form>
  );
}
