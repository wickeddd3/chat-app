import { AvatarWithBadge } from "@/entities/message";
import { Link } from "react-router";
import { CheckCheck } from "lucide-react";
import { dateToString } from "@/shared/utils/date-format";
import type { InboxChannel } from "@/entities/channel";

export function ChatInboxItem({
  inboxItem: { id, displayName, displayImage, lastMessage, online },
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
          <CheckCheck className="ml-auto" size={16} />
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="line-clamp-2 w-[70%] text-xs whitespace-break-spaces">
            {lastMessage.content}
          </span>
          <span className="ml-auto text-xs">
            {dateToString(lastMessage.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
