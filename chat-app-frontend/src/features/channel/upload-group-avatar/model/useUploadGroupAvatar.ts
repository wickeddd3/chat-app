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

const AVATAR_BUCKET = "avatars";

/**
 * Stores a cropped group avatar and points the channel at it.
 *
 * Shares the `avatars` bucket with user avatars but keys the path by channel id,
 * so a group's images sit under their own prefix.
 */
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
      const path = `groups/${channelId}/${String(Date.now())}.${CROPPED_IMAGE_EXTENSION}`;

      const publicUrl = await uploadImageWithProgress(
        blob,
        path,
        AVATAR_BUCKET,
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
