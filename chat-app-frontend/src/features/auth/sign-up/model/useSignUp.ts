import { authClient } from "@/shared/lib/better-auth.client";
import type { SignUpFormSchemaType } from "./schema";
import { useNavigate } from "react-router";

export function useSignUp() {
  const navigate = useNavigate();

  const register = async (
    values: SignUpFormSchemaType,
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await authClient.signUp.email(
      {
        ...values,
        callbackURL: "/messages",
      },
      {
        onSuccess: () => {
          navigate("/messages");
        },
      },
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return { register };
}
