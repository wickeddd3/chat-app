import { authClient } from "@/shared/lib/better-auth.client";
import type { PasswordFormSchemaType } from "./schema";

export function usePassword() {
  const updatePassword = async (
    values: PasswordFormSchemaType,
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await authClient.changePassword({
      ...values,
      revokeOtherSessions: true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { updatePassword };
}
