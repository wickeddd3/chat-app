import { updateEmail } from "@/shared/lib/supabase-auth";
import type { EmailFormSchemaType } from "./schema";
import { toast } from "sonner";

export function useEmail() {
  const updateAccountEmail = async (formData: EmailFormSchemaType) => {
    const { error } = await updateEmail(formData);

    if (error) {
      toast.error("Email update failed", {
        description: "Error occurred while updating email",
        position: "bottom-right",
      });
      return;
    }

    toast.success("Email updated successfully", {
      position: "bottom-right",
    });
  };

  return { updateAccountEmail };
}
