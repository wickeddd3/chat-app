import { FieldGroup } from "@/shared/ui/shadcn/field";
import { Button } from "@/shared/ui/shadcn/button";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { TextField } from "@/shared/ui/form-fields/TextField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GroupChannelFormSchema,
  type GroupChannelFormSchemaType,
} from "../model/schema";
import { useCreateGroupChannel } from "../model/useCreateGroupChannel";

export function GroupChannelForm({ onSuccess }: { onSuccess?: () => void }) {
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
          inputClassName="rounded-2xl py-7 px-4 placeholder:font-medium"
          labelClassName="text-md"
        />
      </FieldGroup>
      <Button
        type="submit"
        className="w-full font-semibold bg-blue-500 hover:bg-blue-600 cursor-pointer"
        disabled={isPending}
      >
        {isPending && <Spinner data-icon="inline-start" />}
        Create Group
      </Button>
    </form>
  );
}
