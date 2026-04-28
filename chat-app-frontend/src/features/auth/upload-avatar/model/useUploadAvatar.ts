import { useState } from "react";
import {
  createUploadPath,
  generatePreview,
  getFileData,
} from "@/shared/utils/upload";
import { uploadImage } from "@/shared/lib/supabase-upload";
import { useUpdateImage } from "./useUpdateImage";
import { toast } from "sonner";

export function useUploadAvatar({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { updateImage } = useUpdateImage();

  const handleImportAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = getFileData(e);

    if (!file) return;

    setFile(file);
    const url = generatePreview(file);
    setPreviewUrl(url);
  };

  const handleUploadAvatar = async ({
    onSuccessUpload,
  }: {
    onSuccessUpload?: () => void;
  }) => {
    if (!file) return;

    setIsUploading(true);

    try {
      // Create unique file path
      const filePath = createUploadPath(userId, file);

      // Get Public URL after upload
      const publicUrl = await uploadImage(file, filePath, "avatars");

      // Update user image
      await updateImage({
        image: publicUrl,
      });
      setIsUploading(false);
      onSuccessUpload?.();
      toast.success("Profile avatar uploaded successfully", {
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setIsUploading(false);
    }
  };

  return {
    previewUrl,
    isUploading,
    handleImportAvatar,
    handleUploadAvatar,
  };
}
