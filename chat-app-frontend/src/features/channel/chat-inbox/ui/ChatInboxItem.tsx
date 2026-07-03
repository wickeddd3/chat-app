import { Link, useParams } from "react-router";
import { FaCheckDouble } from "react-icons/fa6";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { dateToNow } from "@/shared/utils/date-format";
import { cn } from "@/shared/lib/utils";
import { useMarkAsRead } from "../model/useMarkAsRead";
import type { InboxChannel } from "@/entities/channel";

export interface ChatInboxItemProps {
  inboxItem: InboxChannel;
}

export function ChatInboxItem({
  inboxItem: {
    id,
    displayName,
    displayImage,
    lastMessage,
    online,
    unreadCount = 0,
  },
}: ChatInboxItemProps) {
  const { channelId } = useParams();
  const isActive = channelId === id;

  const { markAsRead } = useMarkAsRead();

  const displayMessage =
    unreadCount > 1
      ? `${unreadCount} unread messages`
      : lastMessage?.content || "";

  return (
    <Link
      to={`/messages/${id}`}
      className={cn(
        `flex items-center gap-4 border-b p-4 text-sm leading-tight last:border-b-0 
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full 
        overflow-hidden transition-colors`,
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
      )}
      onClick={() => markAsRead(channelId)}
    >
      <div className="shrink-0">
        <ProfileAvatar imageSrc={displayImage} isOnline={online} badge={true} />
      </div>

      <div className="flex-1 flex flex-col items-start min-w-0 gap-1.5">
        <div className="flex w-full items-center justify-between gap-2 min-w-0">
          <p className="font-medium text-foreground truncate flex-1">
            {displayName}
          </p>

          {lastMessage && (
            <div className="shrink-0 flex items-center gap-1.5 text-muted-foreground/60">
              <span className="text-[11px] whitespace-nowrap">
                {dateToNow(lastMessage.createdAt)}
              </span>
              <FaCheckDouble
                className={cn(
                  unreadCount === 0 ? "text-primary" : "opacity-40",
                )}
                size={12}
              />
            </div>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-2 min-w-0">
          {lastMessage && (
            <p
              className={cn(
                "text-xs text-muted-foreground truncate flex-1 min-w-0",
                unreadCount > 0 ? "font-semibold text-foreground" : "",
              )}
            >
              {displayMessage}
            </p>
          )}

          {unreadCount > 0 && (
            <span
              className="shrink-0 text-xs text-primary self-center leading-none"
              aria-label="Unread indicator"
            >
              &#x25CF;
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
