import { authClient } from "@/shared/lib/better-auth.client";
import type { PasswordFormSchemaType } from "./schema";

export function usePassword() {
  const updatePassword = async ({
    currentPassword,
    newPassword,
  }: PasswordFormSchemaType): Promise<any> => {
    const response = await authClient.changePassword({
      currentPassword: currentPassword,
      newPassword: newPassword,
      revokeOtherSessions: true,
    });
    return response;
  };

  return { updatePassword };
}
