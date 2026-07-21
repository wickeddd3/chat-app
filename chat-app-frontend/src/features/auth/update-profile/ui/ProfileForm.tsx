import { Button } from "@/shared/ui/shadcn/button";
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
          size="lg"
        />
        <TextField
          control={form.control}
          name="username"
          id="username"
          label="Username"
          placeholder="Username"
          size="lg"
        />
        <Button type="submit" className="mt-6 cursor-pointer font-semibold">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
