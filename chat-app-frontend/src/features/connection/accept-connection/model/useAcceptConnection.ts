import {
  useMutation,
  useQueryClient,
  type UseMutateFunction,
} from "@tanstack/react-query";
import { acceptConnectionRequestApi } from "../api/connections.api";
import {
  onError,
  onMutate,
  onSuccess,
  type TData,
  type TError,
  type TVariables,
  type TContext,
} from "./optimistic-update";

export function useAcceptConnection(): {
  acceptConnectionRequest: UseMutateFunction<
    TData,
    TError,
    TVariables,
    TContext
  >;
  isPending: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation<
    TData,
    TError,
    TVariables,
    TContext
  >({
    mutationFn: (connectionId: string) =>
      acceptConnectionRequestApi(connectionId),

    onMutate: (variables) => onMutate(variables, { client: queryClient }),

    onError: (err, variables, context) => onError(err, variables, context),

    onSuccess: (data, variables, context) =>
      onSuccess(data, variables, context),
  });

  return {
    acceptConnectionRequest: mutate,
    isPending,
    error,
  };
}
