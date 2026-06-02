import { authClient } from "@/shared/lib/better-auth.client";
import type { ProfileFormSchemaType } from "./schema";

export function useProfile() {
  const updateUser = async (
    values: ProfileFormSchemaType,
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await authClient.updateUser({
      ...values,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { updateUser };
}
