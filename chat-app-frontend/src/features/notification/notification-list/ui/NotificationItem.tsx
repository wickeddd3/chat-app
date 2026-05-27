import type { Notification } from "@/entities/notification";
import { iconType } from "../model/notification-icons";
import { dateToNow } from "@/shared/utils/date-format";
import { cn } from "@/shared/lib/utils";

export function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = iconType[notification.type];

  return (
    <article
      className={cn(
        "flex justify-between items-center gap-4 px-4 py-2 border-b hover:bg-sidebar-accent cursor-pointer",
        notification.isRead ? "" : "bg-sidebar-accent/50",
      )}
      onClick={onClick}
    >
      <Icon
        size={22}
        className={cn(
          "text-blue-400",
          notification.isRead ? "" : "text-blue-500",
        )}
      />
      <div className="flex-1 flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1
            className={cn(
              "text-sm text-muted-foreground",
              notification.isRead ? "" : "font-medium text-gray-900",
            )}
          >
            {notification.title}
          </h1>
          <p
            className={cn(
              "text-xs text-muted-foreground",
              notification.isRead ? "" : "font-medium text-gray-900",
            )}
          >
            {notification.content}
          </p>
        </div>
        <span className="text-xs">{dateToNow(notification.createdAt)}</span>
      </div>
    </article>
  );
}
