import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import type { User } from "@/entities/user";
import { updateImageApi } from "../api/auth.api";

export function useUpdateImage(): {
  updateImage: UseMutateFunction<User, Error, { image: string }, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: { image: string }) => updateImageApi(formData),
  });

  return {
    updateImage: mutate,
    isPending: isPending,
    error: error,
  };
}
