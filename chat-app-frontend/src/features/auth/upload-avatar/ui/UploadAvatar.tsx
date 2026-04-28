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
import { CloudUploadIcon } from "lucide-react";
import { useUploadAvatar } from "../model/useUploadAvatar";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { useState } from "react";

export function UploadAvatar({ userId }: { userId: string }) {
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
            className="cursor-pointer font-semibold px-4 bg-blue-500 hover:bg-blue-600"
            onClick={() => setOpen(true)}
          >
            Change avatar
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
              className="w-full h-fit flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                <CloudUploadIcon size={50} className="text-gray-500" />
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
                className="w-full font-semibold bg-blue-500 hover:bg-blue-600 cursor-pointer"
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
