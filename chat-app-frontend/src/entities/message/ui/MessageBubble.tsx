import { memo } from "react";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { MessageContent } from "./MessageContent";
import { QuotedMessage } from "./QuotedMessage";
import { ArrowBendUpLeftIcon } from "@phosphor-icons/react";
import { DeliveryStatus, type DeliveryState } from "./DeliveryStatus";
import { dateToString } from "@/shared/utils/date-format";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";
import { messageBubbleVariants } from "@/shared/lib/motion";
import {
  endsRun,
  startsRun,
  type RunPosition,
} from "../model/message-grouping";
import type { Message, NewMessage } from "../model/message.types";

export interface MessageBubbleProps {
  message: Message | NewMessage;
  isAuthorsMessage: boolean;
  /** The reader wrote the message this one quotes — attribute the quote to "You". */
  quotesOwnMessage?: boolean;
  /**
   * Flashes the bubble, to land the eye after jumping to it from a quote.
   */
  isHighlighted?: boolean;
  /**
   * Starts a reply to this message. Omitted where replying isn't available (a
   * closed thread), which is what removes the affordance.
   */
  onReply?: (message: Message | NewMessage) => void;
  /** Scrolls to the message this one quotes. */
  onJumpToParent?: (parentId: string) => void;
  /** Where this message sits in its author's run of consecutive messages. */
  position?: RunPosition;
  /** Group channels need the author named; a direct thread already knows who. */
  showAuthorName?: boolean;
  /** Play the entrance animation (only for messages that just arrived). */
  animate?: boolean;
  /** Stable identity for this row, echoed back through `onAnimated`. */
  messageKey?: string;
  /**
   * Fired once the entrance animation settles, so the owner can retire the flag.
   * Takes the row's `messageKey` so the callback can stay referentially stable
   * across every row — which is what lets the memoized bubble skip re-renders.
   */
  onAnimated?: (key: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isAuthorsMessage,
  quotesOwnMessage = false,
  isHighlighted = false,
  onReply,
  onJumpToParent,
  position = "solo",
  showAuthorName = false,
  animate = false,
  messageKey,
  onAnimated,
}: MessageBubbleProps) {
  const {
    content,
    createdAt,
    author: { name: authorName, image: authorImage },
    isSending,
    parent,
  } = message;

  const opensRun = startsRun(position);
  const closesRun = endsRun(position);

  // A message still in flight has no server id yet, so there is nothing for a
  // reply to point at — the affordance appears once it lands.
  const canReply = !!onReply && !isSending && !!message.id;

  const parentId = parent?.id;
  const jumpToParent =
    onJumpToParent && parentId ? () => onJumpToParent(parentId) : undefined;

  // An optimistic message is still in flight; anything the server has handed
  // back is at least stored, and a receipt from a recipient makes it read.
  const deliveryState: DeliveryState = isSending
    ? "sending"
    : "readCount" in message && (message.readCount ?? 0) > 0
      ? "read"
      : "delivered";

  return (
    <motion.div
      variants={messageBubbleVariants}
      initial={animate ? "initial" : false}
      animate="animate"
      onAnimationComplete={
        animate && onAnimated && messageKey
          ? () => onAnimated(messageKey)
          : undefined
      }
      className={cn(
        "group/message flex w-full min-w-0 gap-2 px-4",
        isAuthorsMessage ? "flex-row-reverse" : "",
        // Runs breathe as a block: a gap between them, near-touching within one.
        opensRun ? "pt-3.5" : "pt-0.75",
      )}
    >
      {/* Reserved either way, so every bubble in a run shares one edge and the
          two sides stay symmetric even though only one of them is labelled. */}
      <div className="w-6 shrink-0 mt-0.5">
        {opensRun && !isAuthorsMessage && (
          <ProfileAvatar imageSrc={authorImage || ""} size="sm" />
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-0.75 min-w-0 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]",
          isAuthorsMessage ? "items-end" : "items-start",
        )}
      >
        {opensRun && showAuthorName && !isAuthorsMessage && (
          <span className="px-1 text-[11px] font-semibold text-muted-foreground truncate max-w-full">
            {authorName}
          </span>
        )}

        {/* The reply button rides alongside the bubble rather than inside it,
            so it never reflows the text or eats a tap on the message. */}
        <div
          className={cn(
            "flex max-w-full min-w-0 items-center gap-1",
            isAuthorsMessage ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div
            className={cn(
              `px-3 py-2 rounded-lg min-w-0 text-xs leading-relaxed md:text-sm
               wrap-break-word whitespace-pre-wrap select-text transition-shadow`,
              // One shape for every bubble: full radius but for a notch on the
              // top corner facing its author, which points the bubble at them.
              isAuthorsMessage
                ? "bg-primary text-primary-foreground rounded-tr-[6px]"
                : "bg-muted text-foreground rounded-tl-[6px]",
              // Flashed after jumping here from a quote, so the eye lands on the
              // right bubble rather than on wherever the scroll stopped.
              isHighlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
            )}
          >
            {parent && (
              <div className="mb-1">
                <QuotedMessage
                  parent={parent}
                  isOwnParent={quotesOwnMessage}
                  tone={isAuthorsMessage ? "onPrimary" : "onMuted"}
                  {...(jumpToParent && { onJump: jumpToParent })}
                />
              </div>
            )}

            <MessageContent
              content={content}
              isAuthorsMessage={isAuthorsMessage}
            />
          </div>

          {canReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              aria-label="Reply to message"
              // Hidden until the row is hovered, but always reachable by keyboard
              // — and always laid out, so revealing it never shifts the bubble.
              // A touch device has no hover to reveal it with, so there it stays
              // visible rather than being unreachable.
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring group-hover/message:opacity-100 pointer-coarse:opacity-100"
            >
              <ArrowBendUpLeftIcon className="size-3.5" />
            </button>
          )}
        </div>

        {closesRun && (
          <div className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
            {/* A bare clock time reads cleanly because the day dividers above
                keep it unambiguous. */}
            <span className="whitespace-nowrap">{dateToString(createdAt)}</span>
            {isAuthorsMessage && <DeliveryStatus state={deliveryState} />}
          </div>
        )}
      </div>
    </motion.div>
  );
});
