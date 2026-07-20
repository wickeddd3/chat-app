import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { dateToNow } from "@/shared/utils/date-format";
import { ChecksIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { messageBubbleVariants } from "@/shared/lib/motion";
import type { Message, NewMessage } from "../model/message.types";

export interface MessageBubbleProps {
  message: Message | NewMessage;
  isAuthorsMessage: boolean;
  /** Play the entrance animation (only for messages that just arrived). */
  animate?: boolean;
  /** Fired once the entrance animation settles, so the owner can retire the flag. */
  onAnimationComplete?: () => void;
}

export function MessageBubble({
  message,
  isAuthorsMessage,
  animate = false,
  onAnimationComplete,
}: MessageBubbleProps) {
  const {
    content,
    createdAt,
    author: { name: authorName, image: authorImage },
    isSending,
  } = message;

  return (
    <motion.div
      variants={messageBubbleVariants}
      initial={animate ? "initial" : false}
      animate="animate"
      onAnimationComplete={animate ? onAnimationComplete : undefined}
      className={`
        flex justify-start gap-2 px-4 py-1 w-full min-w-0
        ${isAuthorsMessage ? "flex-row-reverse pl-12" : "pr-12"}
      `}
    >
      <div className="shrink-0 mt-0.5">
        <ProfileAvatar imageSrc={authorImage || ""} size="sm" />
      </div>

      <div
        className={`
          flex flex-col gap-1.5 p-3 min-w-0 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]
          ${
            isAuthorsMessage
              ? "bg-primary text-white rounded-l-lg rounded-br-lg"
              : "bg-muted rounded-r-lg rounded-bl-lg text-foreground"
          }
        `}
      >
        <div className="flex items-center justify-between gap-4 w-full min-w-0 text-[11px]">
          <span className="font-semibold opacity-85 truncate flex-1 min-w-0">
            {authorName}
          </span>
          <span className="opacity-60 shrink-0 whitespace-nowrap">
            {dateToNow(createdAt)}
          </span>
        </div>

        <p className="text-xs leading-relaxed wrap-break-word whitespace-pre-wrap select-text md:text-sm">
          {content}
        </p>

        {isAuthorsMessage && (
          <div className="flex justify-end w-full mt-0.5 shrink-0">
            <ChecksIcon
              className={`size-3 ${isSending ? "opacity-40 animate-pulse" : "opacity-90"}`}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
