import { memo } from "react";
import type { Notification } from "../model/notification.types";
import { iconType } from "../model/notification-icons";
import { dateToNow } from "@/shared/utils/date-format";
import { cn } from "@/shared/lib/utils";

export interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = iconType[notification.type];
  const isUnread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/notification relative w-full overflow-hidden text-left",
        "flex items-start gap-3 px-4 py-3 cursor-pointer",
        "transition-colors hover:bg-accent",
        isUnread && "bg-primary/6",
      )}
    >
      {/* Unread reads three ways at once — a brand rail, a tinted ground and
          weighted text — so it survives both themes and colour-blind viewing,
          where a hue shift alone would not. */}
      {isUnread && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 w-0.5 bg-primary"
        />
      )}

      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
          isUnread
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon weight="duotone" className="size-5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              isUnread ? "font-semibold text-foreground" : "text-foreground/80",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {dateToNow(notification.createdAt)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {notification.content}
        </p>
      </div>

      {/* The visual unread cues are all decorative, so the state is named here
          for assistive tech rather than left to colour and weight. */}
      {isUnread && <span className="sr-only">Unread</span>}
    </button>
  );
});
