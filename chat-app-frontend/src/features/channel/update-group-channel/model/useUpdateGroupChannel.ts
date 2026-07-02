import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { updateGroupChannelApi } from "../api/channels.api";
import type { Channel } from "@/entities/channel";
import { toast } from "sonner";
import type { GroupChannelFormSchemaType } from "@/entities/connection";

export function useUpdateGroupChannel(channelId: string): {
  updateGroupChannel: UseMutateFunction<
    Channel,
    Error,
    GroupChannelFormSchemaType,
    unknown
  >;
  isPending: boolean;
  error: unknown;
} {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: GroupChannelFormSchemaType) =>
      updateGroupChannelApi(channelId, formData),
    onSuccess: () => {
      toast.success("Group updated successfully", {
        position: "bottom-right",
      });
    },
    onError: (error) => {
      toast.error("Group updating failed", {
        description: error?.message || "Error occurred while updating group",
        position: "bottom-right",
      });
    },
  });

  return {
    updateGroupChannel: mutate,
    isPending: isPending,
    error: error,
  };
}
