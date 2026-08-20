import { XIcon } from "@phosphor-icons/react";
import { QuotedMessage } from "@/entities/message";
import type { ReplyTarget } from "../model/useReplyTarget";

export interface ReplyPreviewProps {
  replyTarget: ReplyTarget;
  /** The reader wrote the message being replied to. */
  isOwnTarget: boolean;
  onCancel: () => void;
}

/**
 * The bar above the composer showing what the draft is replying to.
 *
 * It reuses the bubble's quote block, so what the composer promises and what
 * the sent message shows are the same thing rendered twice — no second layout
 * to keep in step.
 */
export function ReplyPreview({
  replyTarget,
  isOwnTarget,
  onCancel,
}: ReplyPreviewProps) {
  return (
    <div className="mb-1.5 flex w-full items-center gap-2 rounded-lg bg-muted/60 p-1.5">
      <div className="min-w-0 flex-1">
        <QuotedMessage parent={replyTarget} isOwnParent={isOwnTarget} />
      </div>

      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel reply"
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
