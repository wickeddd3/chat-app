import { authClient } from "@/shared/lib/better-auth.client";
import type { SignUpFormSchemaType } from "./schema";

export function useSignUp() {
  const register = async ({
    email,
    password,
    name,
  }: SignUpFormSchemaType): Promise<any> => {
    const response = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: "/messages",
    });
    return response;
  };

  return { register };
}
