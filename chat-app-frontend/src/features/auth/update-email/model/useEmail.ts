import { authClient } from "@/shared/lib/better-auth.client";
import type { EmailFormSchemaType } from "./schema";

export function useEmail() {
  const updateEmail = async ({ email }: EmailFormSchemaType): Promise<any> => {
    const response = await authClient.changeEmail({
      newEmail: email,
    });
    return response;
  };

  return { updateEmail };
}
