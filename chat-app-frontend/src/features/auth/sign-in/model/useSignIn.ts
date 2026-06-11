import type { SignInFormSchemaType } from "./schema";
import { signIn } from "@/shared/lib/supabase-auth";
import { toast } from "sonner";

export function useSignIn() {
  const login = async (formData: SignInFormSchemaType) => {
    const { error } = await signIn(formData);

    if (error) {
      toast.error("Login Failed", {
        description: "Invalid email or password",
        position: "bottom-right",
      });
      return;
    }

    toast.success("Login Successful", {
      position: "bottom-right",
    });
  };

  return { login };
}
