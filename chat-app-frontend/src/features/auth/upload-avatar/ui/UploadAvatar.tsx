import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { CameraIcon, CloudArrowUpIcon } from "@phosphor-icons/react";
import { useUploadAvatar } from "../model/useUploadAvatar";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { useState } from "react";

export interface UploadAvatarProps {
  userId: string;
}

export function UploadAvatar({ userId }: UploadAvatarProps) {
  const [open, setOpen] = useState(false);

  const { previewUrl, isUploading, handleImportAvatar, handleUploadAvatar } =
    useUploadAvatar({
      userId,
    });

  return (
    // Controlled both ways: with only `open` set, Escape and the overlay could
    // not close the dialog and Cancel was the sole way out.
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="cursor-pointer gap-2">
          <CameraIcon />
          <span className="hidden font-semibold md:inline-block">
            Change avatar
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change avatar</DialogTitle>
          <DialogDescription>
            A square JPG or PNG works best — around 100×100 pixels.
          </DialogDescription>
        </DialogHeader>

        {/* The dropzone doubles as the preview, so picking a second image
            happens in the same place as picking the first. */}
        <label
          htmlFor="dropzone-file"
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/60 px-6 py-8 transition-colors hover:bg-accent has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40"
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview of the avatar you selected"
                className="size-28 rounded-full object-cover ring-2 ring-background"
              />
              <span className="text-sm font-medium text-muted-foreground">
                Choose a different image
              </span>
            </>
          ) : (
            <>
              <CloudArrowUpIcon
                weight="duotone"
                className="size-10 text-muted-foreground"
              />
              <span className="text-sm font-semibold">Click to choose</span>
            </>
          )}
          <input
            id="dropzone-file"
            type="file"
            // `sr-only` rather than `hidden`: display:none takes the input out
            // of the tab order, which left the dropzone keyboard-unreachable.
            className="sr-only"
            accept="image/*"
            onChange={handleImportAvatar}
          />
        </label>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full cursor-pointer font-semibold"
            disabled={!previewUrl || isUploading}
            onClick={() =>
              handleUploadAvatar({ onSuccessUpload: () => setOpen(false) })
            }
          >
            {isUploading && <Spinner data-icon="inline-start" />}
            {isUploading ? "Uploading…" : "Save avatar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full cursor-pointer font-semibold"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
