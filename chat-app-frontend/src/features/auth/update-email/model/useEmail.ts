import { authClient } from "@/shared/lib/better-auth.client";
import type { EmailFormSchemaType } from "./schema";

export function useEmail() {
  const updateEmail = async ({
    email,
  }: EmailFormSchemaType): Promise<{ success: boolean; error?: string }> => {
    const { error } = await authClient.changeEmail({
      newEmail: email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { updateEmail };
}
