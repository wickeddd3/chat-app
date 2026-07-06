import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import type { User } from "@/entities/user";
import type { ProfileFormSchemaType } from "./schema";
import { updateProfileApi } from "../api/auth.api";
import { toast } from "sonner";

export function useProfile(): {
  updateUser: UseMutateFunction<User, Error, ProfileFormSchemaType, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: ProfileFormSchemaType) => updateProfileApi(formData),
    onError: () => {
      toast.error("Profile update failed", {
        description: "Error occurred while updating profile",
      });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
  });

  return {
    updateUser: mutate,
    isPending: isPending,
    error: error,
  };
}
