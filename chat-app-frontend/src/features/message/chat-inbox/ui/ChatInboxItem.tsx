import { AvatarWithBadge, type InboxItem } from "@/entities/message";
import { Link } from "react-router";
import { CheckCheck } from "lucide-react";
import { dateToString } from "@/shared/utils/date-format";

export function ChatInboxItem({
  inboxItem: {
    lastMessage,
    updatedAt,
    otherUser: { name, username, image },
    online,
  },
}: {
  inboxItem: InboxItem & { online: boolean };
}) {
  return (
    <Link
      to={`/messages/@${username}`}
      className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <AvatarWithBadge imageSrc={image} isOnline={online} />
      <div className="flex-1 flex flex-col items-start gap-2">
        <div className="flex w-full items-center gap-2">
          <span>{name}</span>
          <CheckCheck className="ml-auto" size={16} />
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="line-clamp-2 w-[70%] text-xs whitespace-break-spaces">
            {lastMessage}
          </span>
          <span className="ml-auto text-xs">{dateToString(updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
