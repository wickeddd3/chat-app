import { authClient } from "@/shared/lib/better-auth.client";
import type { SignInFormSchemaType } from "./schema";

export function useSignIn() {
  const login = async ({
    email,
    password,
  }: SignInFormSchemaType): Promise<any> => {
    const response = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/messages",
    });
    return response;
  };

  return { login };
}
