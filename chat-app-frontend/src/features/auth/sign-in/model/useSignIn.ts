import type { SignInFormSchemaType } from "./schema";
import { signIn } from "@/shared/lib/supabase-auth";
import { useState } from "react";
import { toast } from "sonner";

export function useSignIn() {
  const [loading, setLoading] = useState(false);

  const login = async (formData: SignInFormSchemaType) => {
    setLoading(true);
    try {
      const { error } = await signIn(formData);

      if (error) {
        toast.error("Login Failed", {
          description: "Invalid email or password",
        });
        return;
      }

      toast.success("Login Successful");
    } catch {
      toast.error("Login Failed", {
        description: "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
