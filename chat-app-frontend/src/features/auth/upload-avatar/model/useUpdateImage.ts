import { authClient } from "@/shared/lib/better-auth.client";

export function useUpdateImage() {
  const updateImage = async ({
    image,
  }: {
    image: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { error } = await authClient.updateUser({
      image,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { updateImage };
}
