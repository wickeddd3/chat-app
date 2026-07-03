import { TextField } from "@/shared/ui/form-fields/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ProfileFormSchema, type ProfileFormSchemaType } from "../model/schema";
import { useProfile } from "../model/useProfile";
import { useEffect } from "react";

export interface ProfileFormProps {
  name: string;
  username: string;
}

export function ProfileForm({ name, username }: ProfileFormProps) {
  const form = useForm<ProfileFormSchemaType>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: "",
      username: "",
    },
  });

  const { updateUser } = useProfile();

  async function onSubmit(data: ProfileFormSchemaType) {
    await updateUser(data);
  }

  useEffect(() => {
    form.reset({
      name: name,
      username: username,
    });
  }, [name, username, form]);

  return (
    <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <TextField
          control={form.control}
          name="name"
          id="name"
          label="Name"
          placeholder="Full Name"
          inputClassName="rounded-xl md:rounded-2xl py-5 md:py-7 px-3 md:px-4 text-sm placeholder:font-medium"
          labelClassName="text-md"
        />
        <TextField
          control={form.control}
          name="username"
          id="username"
          label="Username"
          placeholder="Username"
          inputClassName="rounded-xl md:rounded-2xl py-5 md:py-7 px-3 md:px-4 text-sm placeholder:font-medium"
          labelClassName="text-md"
        />
        <button className="bg-primary rounded-xl p-3 text-white font-bold cursor-pointer mt-6 hover:bg-primary/90">
          Save Changes
        </button>
      </div>
    </form>
  );
}
