import { memo, useState } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";
import { UploadProgressRing } from "./UploadProgressRing";
import { ImageLightbox } from "./ImageLightbox";
import { fitImageBox } from "../model/image-box";

export interface MessageImageProps {
  /** The stored image, or a local object URL while it is still uploading. */
  src: string;
  /** Natural size, used to reserve the box before the image loads. */
  width?: number | null;
  height?: number | null;
  /** 0–100 while uploading; absent once the photo is stored. */
  uploadProgress?: number | undefined;
  uploadFailed?: boolean;
  onRetry?: (() => void) | undefined;
}

export const MessageImage = memo(function MessageImage({
  src,
  width,
  height,
  uploadProgress,
  uploadFailed = false,
  onRetry,
}: MessageImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const box = fitImageBox(width, height);

  const isUploading = uploadProgress !== undefined && !uploadFailed;
  // Only a stored photo can be opened full-size; a local preview mid-upload
  // has nothing to open yet.
  const canOpen = !isUploading && !uploadFailed;

  const image = (
    <img
      src={src}
      alt=""
      width={box.width}
      height={box.height}
      loading="lazy"
      className={cn(
        "block h-full w-full rounded-[6px] object-cover",
        // Dimmed while in flight, so the ring on top of it stays legible.
        (isUploading || uploadFailed) && "opacity-60",
      )}
    />
  );

  return (
    <>
      <div
        className="relative overflow-hidden rounded-[6px] bg-foreground/5"
        style={{ width: box.width, height: box.height, maxWidth: "100%" }}
      >
        {canOpen ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Open photo"
            className="block size-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {image}
          </button>
        ) : (
          image
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <UploadProgressRing percent={uploadProgress} />
          </div>
        )}

        {uploadFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <WarningCircleIcon
              weight="fill"
              className="size-7 text-destructive"
            />
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="cursor-pointer rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {canOpen && (
        <ImageLightbox
          src={src}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </>
  );
});
