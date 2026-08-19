import { Button } from "@/shared/ui/shadcn/button";
import { CameraIcon } from "@phosphor-icons/react";
import { AvatarUploadDialog } from "@/shared/ui/avatar-upload/AvatarUploadDialog";
import { useAuth } from "@/entities/auth";
import { useUploadGroupAvatar } from "../model/useUploadGroupAvatar";

export interface UploadGroupAvatarProps {
  channelId: string;
  channelName: string;
  currentImageUrl?: string | null;
}

/**
 * Admin-only in practice — the drawer only renders this for an admin, and the
 * server rejects everyone else with a 403.
 */
export function UploadGroupAvatar({
  channelId,
  channelName,
  currentImageUrl,
}: UploadGroupAvatarProps) {
  const { authUser } = useAuth();
  const { uploadAvatar, removeAvatar } = useUploadGroupAvatar({
    channelId,
    authId: authUser?.id,
  });

  return (
    <AvatarUploadDialog
      title="Change group photo"
      description={`Drag an image in or pick one for ${channelName}, then position it in the circle.`}
      currentImageUrl={currentImageUrl}
      onUpload={uploadAvatar}
      onRemove={removeAvatar}
      trigger={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer gap-2"
          aria-label="Change group photo"
          title="Change group photo"
        >
          <CameraIcon className="size-4" />
          <span className="font-semibold">Photo</span>
        </Button>
      }
    />
  );
}
