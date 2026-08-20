import { useEffect, useRef } from "react";
import { PaperPlaneRightIcon } from "@phosphor-icons/react";
import { EmojiPicker } from "@/shared/ui/emoji-picker/EmojiPicker";
import { useSendMessage } from "../model/useSendMessage";
import { useTypingBroadcast } from "../model/useTypingBroadcast";
import { ReplyPreview } from "./ReplyPreview";
import type { ReplyTarget } from "../model/useReplyTarget";

export interface MessageInputProps {
  channelId: string;
  /** The message this draft replies to, staged from the timeline. */
  replyTarget?: ReplyTarget | null;
  /** The reader wrote the message being replied to. */
  isOwnReplyTarget?: boolean;
  onCancelReply?: () => void;
}

export function MessageInput({
  channelId,
  replyTarget = null,
  isOwnReplyTarget = false,
  onCancelReply,
}: MessageInputProps) {
  const { message, setMessage, sendMessage } = useSendMessage({
    channelId,
    replyTarget,
    ...(onCancelReply && { onSent: onCancelReply }),
  });
  const { notifyTyping, stopTyping } = useTypingBroadcast(channelId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Staging a reply is an invitation to type — the user picked the message from
  // the timeline, so the caret should already be waiting in the composer.
  useEffect(() => {
    if (replyTarget) inputRef.current?.focus();
  }, [replyTarget]);

  // Escape backs out of the reply without clearing the draft text.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && replyTarget) {
      e.preventDefault();
      onCancelReply?.();
    }
  };

  // Clearing the field back to empty is a retraction, not a keystroke — the
  // user visibly abandoned the draft, so don't make the other side wait it out.
  const handleChange = (value: string) => {
    setMessage(value);
    if (value.trim()) {
      notifyTyping();
    } else {
      stopTyping();
    }
  };

  // Insert at the caret (text inputs retain selectionStart while blurred, so the
  // picker can stay open); fall back to appending when the input was never focused.
  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? message.length;
    const end = input?.selectionEnd ?? start;

    handleChange(message.slice(0, start) + emoji + message.slice(end));

    const caret = start + emoji.length;
    requestAnimationFrame(() => {
      input?.setSelectionRange(caret, caret);
    });
  };

  // The hook already refuses blank sends; mirroring it here means the button
  // shows that state rather than looking live and doing nothing.
  const canSend = message.trim().length > 0;

  // Sending ends the burst — the draft is gone, so retract before it lands.
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    stopTyping();
    sendMessage(e);
  };

  return (
    <div className="w-full">
      {replyTarget && (
        <ReplyPreview
          replyTarget={replyTarget}
          isOwnTarget={isOwnReplyTarget}
          onCancel={() => onCancelReply?.()}
        />
      )}

      <form
        onSubmit={handleSubmit}
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
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyTarget ? "Type a reply" : "Type a message"}
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
    </div>
  );
}
