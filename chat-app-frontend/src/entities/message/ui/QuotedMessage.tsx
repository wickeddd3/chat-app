import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { MessageParent } from "../model/message.types";

export interface QuotedMessageProps {
  parent: MessageParent;
  /** The reader wrote the quoted message — it is attributed to "You". */
  isOwnParent: boolean;
  /**
   * Where the quote is rendered. Inside the reader's own (filled) bubble the
   * accent has to come off the foreground colour; everywhere else it can use the
   * primary hue.
   */
  tone?: "onPrimary" | "onMuted";
  /** Scrolls the timeline to the quoted message. Omitted in the composer. */
  onJump?: () => void;
}

/**
 * The quote block a reply carries: an accent rail, who was quoted, and a
 * single-line excerpt of what they said.
 *
 * The excerpt is clamped rather than truncated in the data, so a long quote
 * cannot make a reply taller than the reply itself — and the full original is
 * always one jump away.
 */
export const QuotedMessage = memo(function QuotedMessage({
  parent,
  isOwnParent,
  tone = "onMuted",
  onJump,
}: QuotedMessageProps) {
  const onPrimary = tone === "onPrimary";
  const authorLabel = isOwnParent ? "You" : (parent.author.name ?? "Unknown");

  // A quoted system line has no real author to name — it is narration.
  const isSystem = parent.type === "SYSTEM";

  const body = (
    <>
      <span
        className={cn(
          "block truncate text-[11px] font-semibold",
          onPrimary ? "text-primary-foreground/90" : "text-primary",
        )}
      >
        {isSystem ? "Update" : authorLabel}
      </span>
      <span
        className={cn(
          "block truncate",
          onPrimary ? "text-primary-foreground/75" : "text-muted-foreground",
        )}
      >
        {parent.content}
      </span>
    </>
  );

  const className = cn(
    `w-full min-w-0 rounded-[6px] border-l-2 py-1 pl-2 pr-2 text-left text-[11px] leading-snug`,
    onPrimary
      ? "border-primary-foreground/60 bg-primary-foreground/15"
      : "border-primary bg-primary/8",
    onJump &&
      cn(
        "cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-1",
        onPrimary
          ? "hover:bg-primary-foreground/25 focus-visible:outline-current"
          : "hover:bg-primary/15 focus-visible:outline-ring",
      ),
  );

  if (!onJump) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onJump}
      aria-label={`Go to the quoted message from ${isSystem ? "the group" : authorLabel}`}
      className={className}
    >
      {body}
    </button>
  );
});
