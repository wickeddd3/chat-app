import { memo, useMemo } from "react";
import { Link, useParams } from "react-router";
import { ChecksIcon } from "@phosphor-icons/react";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { dateToNow } from "@/shared/utils/date-format";
import { cn } from "@/shared/lib/utils";
import { useMarkAsRead } from "../model/useMarkAsRead";
import { useAuth } from "@/entities/auth";
import { useTypingUsers } from "@/entities/message";
import type { InboxChannel } from "@/entities/channel";

export interface ChatInboxItemProps {
  inboxItem: InboxChannel;
}

export const ChatInboxItem = memo(function ChatInboxItem({
  inboxItem: {
    id,
    displayName,
    displayImage,
    channelMembers,
    lastMessage,
    online,
    unreadCount = 0,
  },
}: ChatInboxItemProps) {
  const { channelId } = useParams();
  const isActive = channelId === id;

  const { markAsRead } = useMarkAsRead();
  const { authUser } = useAuth();

  // The row already carries its members, so naming a typist costs no request.
  const participants = useMemo(
    () => channelMembers?.map(({ user }) => user),
    [channelMembers],
  );

  const { isTyping, label } = useTypingUsers({
    channelId: id,
    authId: authUser?.id,
    participants,
  });

  // A photo sent without a caption has empty content, which would leave the row
  // blank — it is named instead.
  const lastMessagePreview =
    lastMessage?.content.trim() || (lastMessage?.hasImage ? "📷 Photo" : "");

  const displayMessage =
    unreadCount > 1 ? `${unreadCount} unread messages` : lastMessagePreview;

  return (
    <Link
      to={`/messages/${id}`}
      className={cn(
        `flex items-center gap-4 p-4 text-sm leading-tight 
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full 
        overflow-hidden transition-colors`,
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
      )}
      onClick={() => markAsRead(id)}
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
              <ChecksIcon
                className={cn(
                  "size-3",
                  unreadCount === 0 ? "text-primary" : "opacity-40",
                )}
              />
            </div>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-2 min-w-0">
          {/* Typing outranks the preview, and shows even in a channel that has
              no messages yet — where there'd otherwise be nothing to replace. */}
          {isTyping ? (
            <p className="text-xs text-primary truncate flex-1 min-w-0">
              {label}
            </p>
          ) : (
            lastMessage && (
              <p
                className={cn(
                  "text-xs text-muted-foreground truncate flex-1 min-w-0",
                  unreadCount > 0 ? "font-semibold text-foreground" : "",
                )}
              >
                {displayMessage}
              </p>
            )
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
});
