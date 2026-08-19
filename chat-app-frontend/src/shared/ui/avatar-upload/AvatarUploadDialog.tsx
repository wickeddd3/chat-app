import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { Progress } from "@/shared/ui/shadcn/progress";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import {
  CloudArrowUpIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { getCroppedImageBlob, type CropArea } from "@/shared/lib/image-crop";
import { UploadAbortedError } from "@/shared/lib/supabase-upload";
import { validateImageFile } from "@/shared/utils/upload";
import { cn } from "@/shared/lib/utils";

export interface AvatarUploadHandlers {
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

export interface AvatarUploadDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  /** Shown as the "current" image, and enables Remove when set. */
  currentImageUrl?: string | null;
  /** Stores the cropped square and persists the resulting URL. */
  onUpload: (blob: Blob, handlers: AvatarUploadHandlers) => Promise<void>;
  /** Clears the avatar. Omit to hide the Remove control entirely. */
  onRemove?: () => Promise<void>;
}

/** idle → cropping → uploading. Errors can surface from any of them. */
type Stage = "idle" | "cropping" | "uploading";

/**
 * The shared avatar picker: choose (click or drop) → crop square → upload with a
 * live progress bar, cancellable mid-flight.
 *
 * Deliberately generic and free of any domain knowledge — a user's avatar and a
 * group's are the same interaction, and the only difference is where the URL
 * ends up, which is what `onUpload` supplies.
 */
export function AvatarUploadDialog({
  trigger,
  title,
  description,
  currentImageUrl,
  onUpload,
  onRemove,
}: AvatarUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [progress, setProgress] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  // Object URLs are leaked memory until revoked, and one is created per pick.
  const objectUrlRef = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const reset = useCallback(() => {
    releaseObjectUrl();
    setStage("idle");
    setError(null);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setProgress(0);
  }, [releaseObjectUrl]);

  const acceptFile = useCallback(
    (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      releaseObjectUrl();
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;

      setError(null);
      setImageSrc(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setStage("cropping");
    },
    [releaseObjectUrl],
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedArea) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setStage("uploading");
    setProgress(0);
    setError(null);

    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedArea);
      await onUpload(blob, {
        onProgress: setProgress,
        signal: controller.signal,
      });
      setOpen(false);
      reset();
    } catch (err) {
      // A cancel is the user's own doing — return them to the crop step with the
      // picture still loaded, rather than accusing them of an error.
      if (err instanceof UploadAbortedError) {
        setStage("cropping");
        setProgress(0);
        return;
      }
      setError(err instanceof Error ? err.message : "The upload failed.");
      setStage("cropping");
    } finally {
      abortRef.current = null;
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setIsRemoving(true);
    setError(null);
    try {
      await onRemove();
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove it.");
    } finally {
      setIsRemoving(false);
    }
  };

  const isUploading = stage === "uploading";

  const handleOpenChange = (next: boolean) => {
    // Closing mid-upload should stop the transfer, not leave it running unseen.
    if (!next && isUploading) abortRef.current?.abort();
    setOpen(next);
    if (!next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {stage === "idle" && (
          <label
            htmlFor="avatar-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) acceptFile(file);
            }}
            className={cn(
              `flex w-full cursor-pointer flex-col items-center justify-center gap-3
               rounded-2xl border border-dashed px-6 py-10 transition-colors
               has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40`,
              isDragging
                ? "border-primary bg-accent"
                : "border-border bg-muted/60 hover:bg-accent",
            )}
          >
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt="Your current avatar"
                className="size-20 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <CloudArrowUpIcon
                weight="duotone"
                className="size-10 text-muted-foreground"
              />
            )}
            <span className="text-sm font-semibold">
              {isDragging
                ? "Drop to use this image"
                : "Click or drag an image here"}
            </span>
            <span className="text-xs text-muted-foreground">
              JPG, PNG, WebP or GIF · up to 5 MB
            </span>
            <input
              id="avatar-dropzone"
              type="file"
              // `sr-only` rather than `hidden`: display:none takes the input out
              // of the tab order, which leaves the dropzone keyboard-unreachable.
              className="sr-only"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) acceptFile(file);
                // Allow re-picking the same file after a validation error.
                e.target.value = "";
              }}
            />
          </label>
        )}

        {imageSrc && stage !== "idle" && (
          <div className="flex flex-col gap-4">
            <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-muted">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                // Only the pixel area matters — the percentage crop is relative
                // to the rendered box, not the source image the canvas reads.
                onCropComplete={(_area: CropArea, areaPixels: CropArea) =>
                  setCroppedArea(areaPixels)
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor="avatar-zoom"
                className="text-xs text-muted-foreground"
              >
                Zoom
              </label>
              <input
                id="avatar-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={isUploading}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed"
              />
            </div>

            {isUploading && (
              <div className="flex flex-col gap-1.5" aria-live="polite">
                <Progress value={progress} />
                <span className="text-xs text-muted-foreground">
                  {progress < 100
                    ? `Uploading… ${String(progress)}%`
                    : "Finishing up…"}
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <WarningIcon weight="fill" className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {stage === "cropping" && (
            <Button
              type="button"
              className="w-full cursor-pointer font-semibold"
              disabled={!croppedArea}
              onClick={() => void handleSave()}
            >
              Save avatar
            </Button>
          )}

          {isUploading && (
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer font-semibold"
              onClick={() => abortRef.current?.abort()}
            >
              Cancel upload
            </Button>
          )}

          {stage === "idle" && onRemove && currentImageUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={isRemoving}
              className="w-full cursor-pointer gap-2 font-semibold text-destructive hover:text-destructive"
              onClick={() => void handleRemove()}
            >
              {isRemoving ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <TrashIcon />
              )}
              Remove photo
            </Button>
          )}

          {!isUploading && (
            <Button
              type="button"
              variant="ghost"
              className="w-full cursor-pointer font-semibold"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
