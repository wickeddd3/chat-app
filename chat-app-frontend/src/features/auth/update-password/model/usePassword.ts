import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import type { User } from "@/entities/user";
import type { PasswordFormSchemaType } from "./schema";
import { updatePasswordApi } from "../api/auth.api";
import { toast } from "sonner";

export function usePassword(): {
  updatePassword: UseMutateFunction<
    User,
    Error,
    PasswordFormSchemaType,
    unknown
  >;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: PasswordFormSchemaType) =>
      updatePasswordApi(formData),
    onError: () => {
      toast.error("Password update failed", {
        description: "Error occurred while updating password",
        position: "bottom-right",
      });
    },
    onSuccess: () => {
      toast.success("Password updated successfully", {
        position: "bottom-right",
      });
    },
  });

  return {
    updatePassword: mutate,
    isPending: isPending,
    error: error,
  };
}
