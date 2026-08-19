import { Button } from "@/shared/ui/shadcn/button";
import { CameraIcon } from "@phosphor-icons/react";
import { AvatarUploadDialog } from "@/shared/ui/avatar-upload/AvatarUploadDialog";
import { useUploadAvatar } from "../model/useUploadAvatar";

export interface UploadAvatarProps {
  userId: string;
  /** Drives the preview and whether "Remove photo" is offered. */
  currentImageUrl?: string | null;
}

export function UploadAvatar({ userId, currentImageUrl }: UploadAvatarProps) {
  const { uploadAvatar, removeAvatar } = useUploadAvatar({ userId });

  return (
    <AvatarUploadDialog
      title="Change avatar"
      description="Drag an image in or pick one, then position it in the circle."
      currentImageUrl={currentImageUrl}
      onUpload={uploadAvatar}
      onRemove={removeAvatar}
      trigger={
        <Button type="button" className="cursor-pointer gap-2">
          <CameraIcon />
          <span className="hidden font-semibold md:inline-block">
            Change avatar
          </span>
        </Button>
      }
    />
  );
}
