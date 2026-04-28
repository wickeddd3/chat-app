import { authClient } from "@/shared/lib/better-auth.client";

export function useUpdateImage() {
  const updateImage = async ({ image }: { image: string }): Promise<any> => {
    const response = await authClient.updateUser({
      image,
    });
    return response;
  };

  return { updateImage };
}
