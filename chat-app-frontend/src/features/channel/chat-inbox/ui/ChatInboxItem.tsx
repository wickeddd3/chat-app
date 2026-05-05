import { AvatarWithBadge } from "@/entities/message";
import { Link } from "react-router";
import { CheckCheck } from "lucide-react";
import { dateToString } from "@/shared/utils/date-format";
import type { InboxChannel } from "@/entities/channel";
import { cn } from "@/shared/lib/utils";

export function ChatInboxItem({
  inboxItem: {
    id,
    displayName,
    displayImage,
    lastMessage,
    online,
    unreadCount = 0,
  },
}: {
  inboxItem: InboxChannel;
}) {
  return (
    <Link
      to={`/messages/${id}`}
      className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <AvatarWithBadge imageSrc={displayImage} isOnline={online?.()} />
      <div className="flex-1 flex flex-col items-start gap-2">
        <div className="flex w-full items-center gap-2">
          <span>{displayName}</span>
          <CheckCheck
            className={cn("ml-auto", `${unreadCount > 0 && "opacity-40"}`)}
            size={16}
          />
        </div>
        <div className="flex w-full items-center gap-2">
          <span
            className={cn(
              "line-clamp-2 w-[70%] text-xs text-gray-800 whitespace-break-spaces",
              `${unreadCount && "font-bold"}`,
            )}
          >
            {unreadCount > 1
              ? `${unreadCount} unread messages`
              : lastMessage.content}{" "}
            &#x2022; {dateToString(lastMessage.createdAt)}
          </span>
          {unreadCount > 0 && (
            <span className="ml-auto text-md text-blue-500">&#x25CF;</span>
          )}
        </div>
      </div>
    </Link>
  );
}
