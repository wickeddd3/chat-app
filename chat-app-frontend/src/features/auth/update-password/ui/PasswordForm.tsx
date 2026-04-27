import {
  PasswordFormSchema,
  type PasswordFormSchemaType,
} from "../model/schema";
import { TextField } from "@/shared/ui/form-fields/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { usePassword } from "../model/usePassword";
import { toast } from "sonner";

export function PasswordForm() {
  const form = useForm<PasswordFormSchemaType>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { updatePassword } = usePassword();

  async function onSubmit(data: PasswordFormSchemaType) {
    const response = await updatePassword(data);

    if (response.error) {
      toast.error("Password update failed", {
        description:
          response?.error?.message || "Error occurred while updating password",
        position: "bottom-right",
      });
      return;
    }

    toast.success("Password updated successfully", {
      position: "bottom-right",
    });
  }

  return (
    <form id="password-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <TextField
          control={form.control}
          name="currentPassword"
          id="currentPassword"
          label="Current Password"
          placeholder="Current Password"
          inputClassName="rounded-2xl py-7 px-4 placeholder:font-medium"
          labelClassName="text-md"
        />
        <TextField
          control={form.control}
          name="newPassword"
          id="newPassword"
          label="New Password"
          placeholder="New Password"
          inputClassName="rounded-2xl py-7 px-4 placeholder:font-medium"
          labelClassName="text-md"
        />
        <TextField
          control={form.control}
          name="confirmNewPassword"
          id="confirmNewPassword"
          label="Confirm New Password"
          placeholder="Confirm New Password"
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
