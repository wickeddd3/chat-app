import {
  useMutation,
  useQueryClient,
  type UseMutateFunction,
} from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { leaveGroupChannelApi } from "../api/channels.api";
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

export interface UseLeaveGroupChannelOptions {
  /**
   * Send the user back to the inbox once they're out. Set when leaving from
   * inside the room they're standing in — staying there would render a channel
   * they can no longer read.
   */
  redirectOnSuccess?: boolean;
}

export function useLeaveGroupChannel(
  authId?: string,
  { redirectOnSuccess = false }: UseLeaveGroupChannelOptions = {},
): {
  leaveGroupChannel: UseMutateFunction<TData, TError, TVariables, TContext>;
  isPending: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const keys = createQueryKeys(authId);

  const { mutate, isPending, error } = useMutation<
    TData,
    TError,
    TVariables,
    TContext
  >({
    mutationFn: ({ channelId }) => leaveGroupChannelApi({ channelId }),
    onMutate: (variables) => onMutate(variables, { client: queryClient, keys }),
    onSuccess: (data, variables, context) => {
      onSuccess(data, variables, context);
      if (redirectOnSuccess) navigate("/messages");
    },
    onError: (err, variables, context) => onError(err, variables, context),
  });

  return {
    leaveGroupChannel: mutate,
    isPending,
    error,
  };
}
