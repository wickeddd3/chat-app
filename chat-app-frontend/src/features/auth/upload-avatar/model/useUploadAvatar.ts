import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  uploadImageWithProgress,
  type UploadWithProgressOptions,
} from "@/shared/lib/supabase-upload";
import { CROPPED_IMAGE_EXTENSION } from "@/shared/lib/image-crop";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { useUpdateImage } from "./useUpdateImage";

const AVATAR_BUCKET = "avatars";

/**
 * Stores a cropped avatar and points the user's profile at it.
 *
 * The blob goes straight to storage (never through our API) and only the
 * resulting public URL is persisted, so the backend never handles image bytes.
 */
export function useUploadAvatar({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { updateImage } = useUpdateImage();
  const keys = createQueryKeys(userId);

  const refreshProfile = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: keys.auth.profile() });
  }, [queryClient, keys]);

  const uploadAvatar = useCallback(
    async (blob: Blob, handlers: UploadWithProgressOptions) => {
      // Crop output is always webp, so the extension is known rather than
      // inherited from whatever the user happened to pick.
      const path = `${userId}/${String(Date.now())}.${CROPPED_IMAGE_EXTENSION}`;

      const publicUrl = await uploadImageWithProgress(
        blob,
        path,
        AVATAR_BUCKET,
        handlers,
      );

      await new Promise<void>((resolve, reject) => {
        updateImage(
          { image: publicUrl },
          { onSuccess: () => resolve(), onError: (err) => reject(err) },
        );
      });

      refreshProfile();
      toast.success("Avatar updated");
    },
    [userId, updateImage, refreshProfile],
  );

  const removeAvatar = useCallback(async () => {
    await new Promise<void>((resolve, reject) => {
      updateImage(
        { image: null },
        { onSuccess: () => resolve(), onError: (err) => reject(err) },
      );
    });

    refreshProfile();
    toast.success("Avatar removed");
  }, [updateImage, refreshProfile]);

  return { uploadAvatar, removeAvatar };
}
