import {
  useMutation,
  useQueryClient,
  type UseMutateFunction,
} from "@tanstack/react-query";
import { removeContactApi } from "../api/connections.api";
import {
  onError,
  onMutate,
  onSuccess,
  type TContext,
  type TData,
  type TError,
  type TVariables,
} from "./cache-update";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useRemoveContact(authId?: string): {
  removeContact: UseMutateFunction<TData, TError, TVariables, TContext>;
  isPending: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();
  const keys = createQueryKeys(authId);

  const { mutate, isPending, error } = useMutation<
    TData,
    TError,
    TVariables,
    TContext
  >({
    mutationFn: ({ contactUserId }) => removeContactApi({ contactUserId }),
    onMutate: (variables) => onMutate(variables, { client: queryClient, keys }),
    onSuccess: (data, variables, context) =>
      onSuccess(data, variables, context),
    onError: (err, variables, context) => onError(err, variables, context),
  });

  return {
    removeContact: mutate,
    isPending,
    error,
  };
}
