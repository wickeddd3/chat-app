import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import type { User } from "@/entities/user";
import type { EmailFormSchemaType } from "./schema";
import { updateEmailApi } from "../api/auth.api";
import { toast } from "sonner";

export function useEmail(): {
  updateEmail: UseMutateFunction<User, Error, EmailFormSchemaType, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: EmailFormSchemaType) => updateEmailApi(formData),
    onError: () => {
      toast.error("Email update failed", {
        description: "Error occurred while updating email",
        position: "bottom-right",
      });
    },
    onSuccess: () => {
      toast.success("Email updated successfully", {
        position: "bottom-right",
      });
    },
  });

  return {
    updateEmail: mutate,
    isPending: isPending,
    error: error,
  };
}
