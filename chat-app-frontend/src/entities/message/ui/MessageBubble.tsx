import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { dateToString } from "@/shared/utils/date-format";
import { cn } from "@/shared/lib/utils";
import { ChecksIcon } from "@phosphor-icons/react";
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
  /** Where this message sits in its author's run of consecutive messages. */
  position?: RunPosition;
  /** Group channels need the author named; a direct thread already knows who. */
  showAuthorName?: boolean;
  /** Play the entrance animation (only for messages that just arrived). */
  animate?: boolean;
  /** Fired once the entrance animation settles, so the owner can retire the flag. */
  onAnimationComplete?: () => void;
}

export function MessageBubble({
  message,
  isAuthorsMessage,
  position = "solo",
  showAuthorName = false,
  animate = false,
  onAnimationComplete,
}: MessageBubbleProps) {
  const {
    content,
    createdAt,
    author: { name: authorName, image: authorImage },
    isSending,
  } = message;

  const opensRun = startsRun(position);
  const closesRun = endsRun(position);

  return (
    <motion.div
      variants={messageBubbleVariants}
      initial={animate ? "initial" : false}
      animate="animate"
      onAnimationComplete={animate ? onAnimationComplete : undefined}
      className={cn(
        "flex w-full min-w-0 gap-2 px-4",
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

        <div
          className={cn(
            `px-3 py-2 rounded-lg min-w-0 text-xs leading-relaxed md:text-sm
             wrap-break-word whitespace-pre-wrap select-text`,
            // One shape for every bubble: full radius but for a notch on the
            // top corner facing its author, which points the bubble at them.
            isAuthorsMessage
              ? "bg-primary text-primary-foreground rounded-tr-[6px]"
              : "bg-muted text-foreground rounded-tl-[6px]",
          )}
        >
          {content}
        </div>

        {closesRun && (
          <div className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
            {/* A bare clock time reads cleanly because the day dividers above
                keep it unambiguous. */}
            <span className="whitespace-nowrap">{dateToString(createdAt)}</span>
            {isAuthorsMessage && (
              <ChecksIcon
                aria-hidden="true"
                className={cn(
                  "size-3",
                  isSending ? "opacity-40 animate-pulse" : "text-primary",
                )}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
