import {
  useMutation,
  useQueryClient,
  type UseMutateFunction,
} from "@tanstack/react-query";
import { markNotificationAsReadApi } from "../api/notifications.api";
import {
  onError,
  onMutate,
  onSuccess,
  type TContext,
  type TData,
  type TError,
  type TVariables,
} from "./cache-update";

export function useReadNotification(): {
  readNotification: UseMutateFunction<TData, TError, TVariables, TContext>;
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
    mutationFn: (notificationIds: string[]) =>
      markNotificationAsReadApi(notificationIds),
    onMutate: (variables) => onMutate(variables, { client: queryClient }),
    onSuccess: (data, variables, context) =>
      onSuccess(data, variables, context),
    onError: (err, variables, context) => onError(err, variables, context),
  });

  return {
    readNotification: mutate,
    isPending: isPending,
    error: error,
  };
}
