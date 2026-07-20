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
    <Dialog open={open}>
      <form id="avatar-form">
        <DialogTrigger asChild>
          <Button
            className="cursor-pointer rounded-lg px-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
            onClick={() => setOpen(true)}
          >
            <CameraIcon />
            <span className="text-md font-semibold hidden md:inline-block">
              Change avatar
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Upload Avatar</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            JPG or PNG (Recommended. 100x100px)
          </DialogDescription>
          <div className="flex flex-col items-center justify-center gap-4 w-full py-3">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="avatar-preview-url"
                className="max-w-32 max-h-32 rounded-2xl"
              />
            )}
            <label
              htmlFor="dropzone-file"
              className="w-full h-fit flex flex-col items-center justify-center bg-muted border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent"
            >
              <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                <CloudArrowUpIcon className="size-10 text-muted-foreground" />
                <p className="mb-2 text-sm font-semibold">Click to import</p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImportAvatar}
              />
            </label>
          </div>

          <DialogFooter>
            <div className="w-full flex flex-col gap-2">
              <Button
                className="w-full font-semibold bg-primary hover:bg-primary/90 cursor-pointer"
                disabled={!previewUrl || isUploading}
                onClick={() =>
                  handleUploadAvatar({ onSuccessUpload: () => setOpen(false) })
                }
              >
                {isUploading && <Spinner data-icon="inline-start" />}
                Upload
              </Button>
              <Button
                variant="outline"
                className="w-full font-semibold cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
