import { authClient } from "@/shared/lib/better-auth.client";
import type { SignUpFormSchemaType } from "./schema";
import { useNavigate } from "react-router";

export function useSignUp() {
  const navigate = useNavigate();

  const register = async ({
    email,
    username,
    password,
    name,
  }: SignUpFormSchemaType): Promise<any> => {
    const response = await authClient.signUp.email(
      {
        email,
        username,
        password,
        name,
        callbackURL: "/messages",
      },
      {
        onSuccess: () => {
          navigate("/messages");
        },
      },
    );
    return response;
  };

  return { register };
}
