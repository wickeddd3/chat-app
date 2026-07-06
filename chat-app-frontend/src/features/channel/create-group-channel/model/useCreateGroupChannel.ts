import {
  useMutation,
  useQueryClient,
  type UseMutateFunction,
} from "@tanstack/react-query";
import { createGroupChannelApi } from "../api/channels.api";
import {
  type Channel,
  buildOptimisticGroupChannel,
  prependInboxChannel,
  inboxListPrefix,
} from "@/entities/channel";
import { useAuth } from "@/entities/auth";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { toast } from "sonner";
import type { GroupChannelFormSchemaType } from "@/entities/connection";

export function useCreateGroupChannel(): {
  createGroupChannel: UseMutateFunction<
    Channel,
    Error,
    GroupChannelFormSchemaType,
    unknown
  >;
  isPending: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();
  const keys = createQueryKeys(authUser?.id);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: GroupChannelFormSchemaType) =>
      createGroupChannelApi(formData),
    onSuccess: (channel, formData) => {
      // Surface the new group at the top of the inbox immediately, using the
      // server-assigned id so the row is navigable right away. A group row is
      // display-complete client-side (displayName = name, no image/messages);
      // channelMembers/order reconcile via the onSettled invalidation.
      prependInboxChannel(
        queryClient,
        keys,
        buildOptimisticGroupChannel(channel.id, formData.name),
      );
      toast.success("Group created successfully");
    },
    onError: (error) => {
      toast.error("Group creation failed", {
        description: error?.message || "Error occurred while creating group",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: inboxListPrefix(keys) });
    },
  });

  return {
    createGroupChannel: mutate,
    isPending: isPending,
    error: error,
  };
}
