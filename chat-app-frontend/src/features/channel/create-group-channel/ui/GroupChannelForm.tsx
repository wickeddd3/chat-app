import { FieldGroup } from "@/shared/ui/shadcn/field";
import { Button } from "@/shared/ui/shadcn/button";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { TextField } from "@/shared/ui/form-fields/TextField";
import {
  MemberListField,
  GroupChannelFormSchema,
  type GroupChannelFormSchemaType,
} from "@/entities/connection";
import { useAuth } from "@/entities/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateGroupChannel } from "../model/useCreateGroupChannel";

export interface GroupChannelFormProps {
  onSuccess?: () => void;
}

export function GroupChannelForm({ onSuccess }: GroupChannelFormProps) {
  const { authUser } = useAuth();

  const form = useForm<GroupChannelFormSchemaType>({
    resolver: zodResolver(GroupChannelFormSchema),
    defaultValues: {
      name: "",
      memberIds: [],
    },
  });

  const { createGroupChannel, isPending } = useCreateGroupChannel();

  async function onSubmit(data: GroupChannelFormSchemaType) {
    createGroupChannel(data);
    onSuccess?.();
  }

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
          inputClassName="text-sm"
          labelClassName="text-md"
        />
        <MemberListField
          control={form.control}
          name="memberIds"
          label="Add Members"
          authId={authUser?.id}
        />
      </FieldGroup>
      <Button
        type="submit"
        className="w-full font-semibold bg-primary hover:bg-primary/90 cursor-pointer"
        disabled={isPending}
      >
        {isPending && <Spinner data-icon="inline-start" />}
        Create Group
      </Button>
    </form>
  );
}
