import { AvatarWithBadge } from "@/entities/message";
import { CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { useInbox } from "../model/useInbox";
import { dateToString } from "@/shared/utils/date-format";

export function ChatInbox() {
  const { data: inbox } = useInbox();

  return (
    <div className="flex-1 flex flex-col border-r">
      <div className="border-b p-4">
        <h1 className="text-base font-medium text-foreground">Chat Inbox</h1>
      </div>
      <div className="flex-1 w-full overflow-y-auto">
        {inbox?.map(
          ({
            lastMessage,
            updatedAt,
            otherUser: { name, username, image },
          }: any) => (
            <Link
              to={`/messages/@${username}`}
              key={`@${username}`}
              className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <AvatarWithBadge imageSrc={image} />
              <div className="flex-1 flex flex-col items-start gap-2">
                <div className="flex w-full items-center gap-2">
                  <span>{name}</span>
                  <CheckCheck className="ml-auto" size={16} />
                </div>
                <div className="flex w-full items-center gap-2">
                  <span className="line-clamp-2 w-[70%] text-xs whitespace-break-spaces">
                    {lastMessage}
                  </span>
                  <span className="ml-auto text-xs">
                    {dateToString(updatedAt)}
                  </span>
                </div>
              </div>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
