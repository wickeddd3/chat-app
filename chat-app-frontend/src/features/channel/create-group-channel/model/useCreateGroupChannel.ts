import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { createGroupChannelApi } from "../api/channels.api";
import type { Channel } from "@/entities/channel";
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
  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: GroupChannelFormSchemaType) =>
      createGroupChannelApi(formData),
    onSuccess: () => {
      toast.success("Group created successfully", {
        position: "bottom-right",
      });
    },
    onError: (error) => {
      toast.error("Group creation failed", {
        description: error?.message || "Error occurred while creating group",
        position: "bottom-right",
      });
    },
  });

  return {
    createGroupChannel: mutate,
    isPending: isPending,
    error: error,
  };
}
