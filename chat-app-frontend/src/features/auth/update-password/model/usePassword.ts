import { updatePassword } from "@/shared/lib/supabase-auth";
import type { PasswordFormSchemaType } from "./schema";
import { toast } from "sonner";

export function usePassword() {
  const updateAccountPassword = async (formData: PasswordFormSchemaType) => {
    const { error } = await updatePassword(formData);

    if (error) {
      toast.error("Password update failed", {
        description: "Error occurred while updating password",
      });
      return;
    }

    toast.success("Password updated successfully");
  };

  return { updateAccountPassword };
}
