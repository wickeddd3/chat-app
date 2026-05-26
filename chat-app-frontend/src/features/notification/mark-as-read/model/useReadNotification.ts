import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { markNotificationAsReadApi } from "../api/notifications.api";

export function useReadNotification(): {
  readNotification: UseMutateFunction<
    { count: number },
    Error,
    string[],
    unknown
  >;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (notificationIds: string[]) =>
      markNotificationAsReadApi(notificationIds),
  });

  return {
    readNotification: mutate,
    isPending: isPending,
    error: error,
  };
}
