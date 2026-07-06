import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { updateGroupChannelApi } from "../api/channels.api";
import {
  type Channel,
  type InboxChannel,
  patchInboxChannel,
  inboxListPrefix,
} from "@/entities/channel";
import { useAuth } from "@/entities/auth";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { toast } from "sonner";
import type { GroupChannelFormSchemaType } from "@/entities/connection";

interface UpdateGroupContext {
  previousInbox: [QueryKey, unknown][];
  previousDetails: InboxChannel | undefined;
}

export function useUpdateGroupChannel(channelId: string): {
  updateGroupChannel: (formData: GroupChannelFormSchemaType) => void;
  isPending: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();
  const keys = createQueryKeys(authUser?.id);
  const detailsKey = keys.channel.details(channelId);

  const { mutate, isPending, error } = useMutation<
    Channel,
    Error,
    GroupChannelFormSchemaType,
    UpdateGroupContext
  >({
    mutationFn: (formData: GroupChannelFormSchemaType) =>
      updateGroupChannelApi(channelId, formData),
    onMutate: async (formData) => {
      // Freeze in-flight fetches so they can't clobber the optimistic patch.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: inboxListPrefix(keys) }),
        queryClient.cancelQueries({ queryKey: detailsKey }),
      ]);

      // Snapshot both caches for rollback.
      const previousInbox = queryClient.getQueriesData({
        queryKey: inboxListPrefix(keys),
      });
      const previousDetails =
        queryClient.getQueryData<InboxChannel>(detailsKey);

      // For a group, displayName === name — patch both the inbox row and the
      // open channel-details view (header/drawer) so the rename shows instantly.
      // Member changes reconcile via the onSettled invalidation.
      patchInboxChannel(queryClient, keys, channelId, {
        name: formData.name,
        displayName: formData.name,
      });
      queryClient.setQueryData<InboxChannel>(detailsKey, (old) =>
        old ? { ...old, name: formData.name, displayName: formData.name } : old,
      );

      return { previousInbox, previousDetails };
    },
    onError: (error, _formData, context) => {
      // Roll back to the pre-mutation snapshots.
      context?.previousInbox.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      if (context)
        queryClient.setQueryData(detailsKey, context.previousDetails);

      toast.error("Group updating failed", {
        description: error?.message || "Error occurred while updating group",
      });
    },
    onSuccess: () => {
      toast.success("Group updated successfully");
    },
    onSettled: () => {
      // Reconcile server-computed fields (member list, ordering).
      void queryClient.invalidateQueries({ queryKey: inboxListPrefix(keys) });
      void queryClient.invalidateQueries({ queryKey: detailsKey });
    },
  });

  return {
    updateGroupChannel: mutate,
    isPending: isPending,
    error: error,
  };
}
