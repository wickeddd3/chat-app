import { XIcon } from "@phosphor-icons/react";
import type { ImageAttachment } from "../model/useImageAttachment";

export interface AttachmentPreviewProps {
  attachment: ImageAttachment;
  onRemove: () => void;
}

/**
 * The thumbnail of the photo staged for sending, shown above the composer.
 *
 * Progress is deliberately not shown here: once sent, the photo becomes a
 * bubble in the timeline and reports its own upload there, so the composer is
 * free again immediately for the next message.
 */
export function AttachmentPreview({
  attachment,
  onRemove,
}: AttachmentPreviewProps) {
  return (
    <div className="mb-1.5 flex w-full items-center gap-2 rounded-lg bg-muted/60 p-1.5">
      <img
        src={attachment.previewUrl}
        alt=""
        className="size-11 shrink-0 rounded-md object-cover"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-foreground">
          Photo ready to send
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {attachment.file.name}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
