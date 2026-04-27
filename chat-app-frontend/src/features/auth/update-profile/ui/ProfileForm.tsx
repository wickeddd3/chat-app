import { TextField } from "@/shared/ui/form-fields/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ProfileFormSchema, type ProfileFormSchemaType } from "../model/schema";
import { useProfile } from "../model/useProfile";
import { toast } from "sonner";
import { useEffect } from "react";

export function ProfileForm({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const form = useForm<ProfileFormSchemaType>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: "",
      username: "",
    },
  });

  const { updateUser } = useProfile();

  async function onSubmit(data: ProfileFormSchemaType) {
    const response = await updateUser(data);

    if (response.error) {
      toast.error("Profile update failed", {
        description:
          response?.error?.message || "Error occurred while updating profile",
        position: "bottom-right",
      });
      return;
    }

    toast.success("Profile updated successfully", {
      position: "bottom-right",
    });
  }

  useEffect(() => {
    form.reset({
      name: name,
      username: username,
    });
  }, [name, username]);

  return (
    <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <TextField
          control={form.control}
          name="name"
          id="name"
          label="Name"
          placeholder="Full Name"
          inputClassName="rounded-2xl py-7 px-4 placeholder:font-medium"
          labelClassName="text-md"
        />
        <TextField
          control={form.control}
          name="username"
          id="username"
          label="Username"
          placeholder="Username"
          inputClassName="rounded-2xl py-7 px-4 placeholder:font-medium"
          labelClassName="text-md"
        />
        <button className="bg-blue-500 rounded-full p-3 text-white font-medium cursor-pointer mt-6">
          Save Changes
        </button>
      </div>
    </form>
  );
}
