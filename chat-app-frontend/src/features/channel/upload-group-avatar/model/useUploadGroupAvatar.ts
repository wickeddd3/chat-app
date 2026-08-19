import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  uploadImageWithProgress,
  type UploadWithProgressOptions,
} from "@/shared/lib/supabase-upload";
import { CROPPED_IMAGE_EXTENSION } from "@/shared/lib/image-crop";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { patchInboxChannel, type InboxChannel } from "@/entities/channel";
import { updateGroupAvatarApi } from "../api/channels.api";

/**
 * Group avatars live in their own bucket rather than under a prefix inside
 * `avatars`, so the two can carry different storage policies — a group's photo
 * is written by whoever admins it, not by the user whose id owns the path.
 */
const GROUP_AVATAR_BUCKET = "groups";

/** Stores a cropped group avatar and points the channel at it. */
export function useUploadGroupAvatar({
  channelId,
  authId,
}: {
  channelId: string;
  authId?: string;
}) {
  const queryClient = useQueryClient();
  const keys = createQueryKeys(authId);

  /**
   * The avatar shows in the room header, the drawer and every inbox row, so all
   * three are patched rather than waiting on a refetch.
   */
  const applyImage = useCallback(
    (image: string | null) => {
      queryClient.setQueryData<InboxChannel>(
        keys.channel.details(channelId),
        (channel) =>
          channel ? { ...channel, image, displayImage: image ?? "" } : channel,
      );
      patchInboxChannel(queryClient, keys, channelId, {
        displayImage: image ?? "",
      });
    },
    [queryClient, keys, channelId],
  );

  const uploadAvatar = useCallback(
    async (blob: Blob, handlers: UploadWithProgressOptions) => {
      // The bucket already scopes these to groups, so the path only needs to
      // separate one channel from another.
      const path = `${channelId}/${String(Date.now())}.${CROPPED_IMAGE_EXTENSION}`;

      const publicUrl = await uploadImageWithProgress(
        blob,
        path,
        GROUP_AVATAR_BUCKET,
        handlers,
      );

      await updateGroupAvatarApi({ channelId, image: publicUrl });

      applyImage(publicUrl);
      toast.success("Group photo updated");
    },
    [channelId, applyImage],
  );

  const removeAvatar = useCallback(async () => {
    await updateGroupAvatarApi({ channelId, image: null });

    applyImage(null);
    toast.success("Group photo removed");
  }, [channelId, applyImage]);

  return { uploadAvatar, removeAvatar };
}
