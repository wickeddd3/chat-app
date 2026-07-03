import type { Notification } from "../model/notification.types";
import { iconType } from "../model/notification-icons";
import { dateToNow } from "@/shared/utils/date-format";
import { cn } from "@/shared/lib/utils";

export interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = iconType[notification.type];

  return (
    <button
      type="button"
      className={cn(
        `flex justify-between items-center gap-4 px-4 py-2 border-b text-left
        hover:bg-sidebar-accent cursor-pointer w-full overflow-hidden`,
        notification.isRead ? "" : "bg-sidebar-accent/50",
      )}
      onClick={onClick}
    >
      <Icon
        size={22}
        className={cn(
          "text-primary/70 shrink-0",
          notification.isRead ? "" : "text-primary",
        )}
      />
      <div className="flex-1 flex justify-between items-center min-w-0 gap-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p
            className={cn(
              "text-sm text-muted-foreground truncate w-full",
              notification.isRead ? "" : "font-medium text-foreground",
            )}
          >
            {notification.title}
          </p>
          <p
            className={cn(
              "text-xs text-muted-foreground truncate w-full",
              notification.isRead ? "" : "font-medium text-foreground",
            )}
          >
            {notification.content}
          </p>
        </div>

        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap self-start pt-0.5">
          {dateToNow(notification.createdAt)}
        </span>
      </div>
    </button>
  );
}
