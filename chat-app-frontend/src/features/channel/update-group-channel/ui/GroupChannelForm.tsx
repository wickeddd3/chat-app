import { FieldGroup } from "@/shared/ui/shadcn/field";
import { Button } from "@/shared/ui/shadcn/button";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { TextField } from "@/shared/ui/form-fields/TextField";
import { MemberListField } from "./MemberListField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GroupChannelFormSchema,
  type GroupChannelFormSchemaType,
} from "../model/schema";
import { useUpdateGroupChannel } from "../model/useUpdateGroupChannel";
import type { InboxChannel } from "@/entities/channel";
import { useEffect } from "react";
import { useAuth } from "@/entities/auth";

export function GroupChannelForm({
  channel,
  onSuccess,
}: {
  channel: InboxChannel;
  onSuccess?: () => void;
}) {
  const { authId } = useAuth();

  const form = useForm<GroupChannelFormSchemaType>({
    resolver: zodResolver(GroupChannelFormSchema),
    defaultValues: {
      name: "",
      memberIds: [],
    },
  });

  const { updateGroupChannel, isPending } = useUpdateGroupChannel(
    channel.id || "",
  );

  async function onSubmit(data: GroupChannelFormSchemaType) {
    updateGroupChannel(data);
    onSuccess?.();
  }

  function setCurrentValues(channel: InboxChannel, authId: string) {
    const name = channel.name;
    const memberIds = channel.channelMembers
      .filter((m) => m.user.id !== authId)
      .map((m) => m.user.id);
    form.reset({
      name,
      memberIds,
    });
  }

  useEffect(() => {
    setCurrentValues(channel, authId || "");
  }, [channel, authId]);

  return (
    <form
      id="group-channel-form"
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <TextField
          control={form.control}
          name="name"
          id="name"
          label="Name"
          placeholder="Group Name"
          labelClassName="text-md"
        />
        <MemberListField
          control={form.control}
          name="memberIds"
          label="Add Members"
        />
      </FieldGroup>
      <Button
        type="submit"
        className="w-full font-semibold bg-blue-500 py-6 hover:bg-blue-600 cursor-pointer"
        disabled={isPending}
      >
        {isPending && <Spinner data-icon="inline-start" />}
        Update Group
      </Button>
    </form>
  );
}
