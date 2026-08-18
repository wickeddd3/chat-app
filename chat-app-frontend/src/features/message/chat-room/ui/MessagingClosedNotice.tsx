import { ProhibitIcon } from "@phosphor-icons/react";

export interface MessagingClosedNoticeProps {
  /** The other party's name, when known — "You and Ada" reads better than "You two". */
  recipientName?: string;
}

/**
 * Stands in for the composer on a direct thread whose connection has been
 * dissolved. The conversation above stays readable; only sending is withdrawn.
 */
export function MessagingClosedNotice({
  recipientName,
}: MessagingClosedNoticeProps) {
  return (
    <div
      role="status"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-center text-sm text-muted-foreground"
    >
      <ProhibitIcon className="size-4 shrink-0" />
      <span>
        {recipientName
          ? `You and ${recipientName} are no longer connected — you can't message each other anymore.`
          : "You are no longer connected — you can't message each other anymore."}
      </span>
    </div>
  );
}
