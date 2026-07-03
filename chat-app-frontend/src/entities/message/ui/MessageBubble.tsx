import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { dateToNow } from "@/shared/utils/date-format";
import { FaCheckDouble } from "react-icons/fa6";
import type { Message, NewMessage } from "../model/message.types";

export interface MessageBubbleProps {
  message: Message | NewMessage;
  isAuthorsMessage: boolean;
}

export function MessageBubble({
  message,
  isAuthorsMessage,
}: MessageBubbleProps) {
  const {
    content,
    createdAt,
    author: { name: authorName, image: authorImage },
    isSending,
  } = message;

  return (
    <div
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

        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap select-text">
          {content}
        </p>

        {isAuthorsMessage && (
          <div className="flex justify-end w-full mt-0.5 shrink-0">
            <FaCheckDouble
              size={14}
              className={isSending ? "opacity-40 animate-pulse" : "opacity-90"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
