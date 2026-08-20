import { useEffect, useRef } from "react";
import { PaperPlaneRightIcon, ImageSquareIcon } from "@phosphor-icons/react";
import { EmojiPicker } from "@/shared/ui/emoji-picker/EmojiPicker";
import { useTypingBroadcast } from "../model/useTypingBroadcast";
import { ReplyPreview } from "./ReplyPreview";
import { AttachmentPreview } from "./AttachmentPreview";
import { ACCEPTED_IMAGE_TYPES, getFileData } from "@/shared/utils/upload";
import type { ReplyTarget } from "../model/useReplyTarget";
import type { ImageAttachment } from "../model/useImageAttachment";

export interface MessageInputProps {
  channelId: string;
  /**
   * The draft and its send, owned by the chat room — the timeline needs the same
   * send state to retry a failed photo, so it cannot live in here.
   */
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  /** The message this draft replies to, staged from the timeline. */
  replyTarget?: ReplyTarget | null;
  /** The reader wrote the message being replied to. */
  isOwnReplyTarget?: boolean;
  onCancelReply?: () => void;
  /** The photo staged for sending, if any. */
  attachment?: ImageAttachment | null;
  onAttachImage?: (file: File) => void;
  onRemoveAttachment?: () => void;
}

export function MessageInput({
  channelId,
  message,
  onMessageChange,
  onSubmit,
  replyTarget = null,
  isOwnReplyTarget = false,
  onCancelReply,
  attachment = null,
  onAttachImage,
  onRemoveAttachment,
}: MessageInputProps) {
  const { notifyTyping, stopTyping } = useTypingBroadcast(channelId);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staging a reply or a photo is an invitation to type — the user picked it
  // from the timeline or the file dialog, so the caret should already be
  // waiting in the composer.
  useEffect(() => {
    if (replyTarget) inputRef.current?.focus();
  }, [replyTarget]);

  useEffect(() => {
    if (attachment) inputRef.current?.focus();
  }, [attachment]);

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
    onMessageChange(value);
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
  // shows that state rather than looking live and doing nothing. A photo can
  // travel without a caption, so it is enough on its own.
  const canSend = message.trim().length > 0 || !!attachment;

  // Sending ends the burst — the draft is gone, so retract before it lands.
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    stopTyping();
    onSubmit(e);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = getFileData(e);
    if (file) onAttachImage?.(file);
    // Cleared so picking the same file twice in a row still fires a change.
    e.target.value = "";
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

      {attachment && (
        <AttachmentPreview
          attachment={attachment}
          onRemove={() => onRemoveAttachment?.()}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-1 rounded-full border border-transparent bg-muted p-1.5 transition-colors focus-within:border-ring focus-within:bg-card focus-within:ring-[3px] focus-within:ring-ring/25"
      >
        {onAttachImage && (
          <>
            {/* The input itself is never shown — the icon button is the control,
                so the file dialog opens from something that matches the composer. */}
            <input
              ref={fileInputRef}
              id="message-image-input"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={handleFilePicked}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a photo"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ImageSquareIcon className="size-5" />
            </button>
          </>
        )}

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
