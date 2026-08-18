import { memo } from "react";

export interface SystemMessageProps {
  /** Already-composed copy, e.g. "Ada left the group". */
  content: string;
}

/**
 * A membership event narrated inside the timeline. Deliberately shaped like the
 * day divider rather than a bubble: it belongs to nobody, so giving it an avatar
 * or a side would read as a message someone sent.
 */
export const SystemMessage = memo(function SystemMessage({
  content,
}: SystemMessageProps) {
  return (
    <div className="flex items-center justify-center px-4 py-2">
      <span className="rounded-full bg-muted/60 px-3 py-1 text-center text-[11px] text-muted-foreground">
        {content}
      </span>
    </div>
  );
});
