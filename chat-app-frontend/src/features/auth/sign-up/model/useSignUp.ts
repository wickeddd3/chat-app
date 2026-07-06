import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import type { User } from "@/entities/user";
import type { SignUpFormSchemaType } from "./schema";
import { signUpApi } from "../api/auth.api";
import { toast } from "sonner";

export function useSignUp(options?: { onSuccess?: (email: string) => void }): {
  register: UseMutateFunction<User, Error, SignUpFormSchemaType, unknown>;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: SignUpFormSchemaType) => signUpApi(formData),
    onError: () => {
      toast.error("Account creation failed", {
        description: "Error occurred while creating account",
        position: "bottom-right",
      });
    },
    onSuccess: (_user, variables) => {
      toast.success("Account created successfully", {
        position: "bottom-right",
      });
      options?.onSuccess?.(variables.email);
    },
  });

  return {
    register: mutate,
    isPending: isPending,
    error: error,
  };
}
