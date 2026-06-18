import {
  useMutation,
  useQueryClient,
  type UseMutateFunction,
} from "@tanstack/react-query";
import { sendConnectionRequestApi } from "../api/connections.api";
import {
  onError,
  onMutate,
  onSuccess,
  type TContext,
  type TData,
  type TError,
  type TVariables,
} from "./cache-update";

export function useSendConnection(): {
  sendConnectionRequest: UseMutateFunction<TData, TError, TVariables, TContext>;
  isPending: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation<
    TData,
    TError,
    TVariables,
    TContext
  >({
    mutationFn: (formData: { receiverId: string }) =>
      sendConnectionRequestApi(formData),
    onMutate: (variables) => onMutate(variables, { client: queryClient }),
    onSuccess: (data, variables, context) =>
      onSuccess(data, variables, context),
    onError: (err, variables, context) => onError(err, variables, context),
  });

  return {
    sendConnectionRequest: mutate,
    isPending: isPending,
    error: error,
  };
}
