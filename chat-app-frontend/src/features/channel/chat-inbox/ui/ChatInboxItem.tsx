import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { Link } from "react-router";
import { CheckCheck } from "lucide-react";
import { dateToNow } from "@/shared/utils/date-format";
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
  const displayMessage =
    unreadCount > 1
      ? `${unreadCount} unread messages`
      : `${lastMessage?.content} • ${dateToNow(lastMessage?.createdAt)}`;

  return (
    <Link
      to={`/messages/${id}`}
      className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <ProfileAvatar
        imageSrc={displayImage}
        isOnline={online?.()}
        badge={true}
      />
      <div className="flex-1 flex flex-col items-start gap-2">
        <div className="flex w-full items-center gap-2">
          <h1>{displayName}</h1>
          {lastMessage && (
            <CheckCheck
              className={cn("ml-auto", `${unreadCount > 0 && "opacity-40"}`)}
              size={16}
            />
          )}
        </div>
        <div className="flex w-full items-center gap-2">
          {lastMessage && (
            <p
              className={cn(
                "line-clamp-2 w-[70%] text-xs text-gray-800 whitespace-break-spaces",
                `${unreadCount && "font-bold"}`,
              )}
            >
              {displayMessage}
            </p>
          )}
          {unreadCount > 0 && (
            <span className="ml-auto text-md text-blue-500">&#x25CF;</span>
          )}
        </div>
      </div>
    </Link>
  );
}
