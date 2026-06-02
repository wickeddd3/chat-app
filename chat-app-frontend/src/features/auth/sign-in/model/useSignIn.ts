import { authClient } from "@/shared/lib/better-auth.client";
import type { SignInFormSchemaType } from "./schema";

export function useSignIn() {
  const login = async (
    values: SignInFormSchemaType,
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await authClient.signIn.email({
      ...values,
      callbackURL: "/messages",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { login };
}
