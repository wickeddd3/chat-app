import { Button } from "@/shared/ui/shadcn/button";
import {
  PasswordFormSchema,
  type PasswordFormSchemaType,
} from "../model/schema";
import { TextField } from "@/shared/ui/form-fields/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { usePassword } from "../model/usePassword";

export function PasswordForm() {
  const form = useForm<PasswordFormSchemaType>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { updateAccountPassword } = usePassword();

  async function onSubmit(data: PasswordFormSchemaType) {
    await updateAccountPassword(data);
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
          size="lg"
        />
        <TextField
          control={form.control}
          name="newPassword"
          id="newPassword"
          label="New Password"
          placeholder="New Password"
          size="lg"
        />
        <TextField
          control={form.control}
          name="confirmNewPassword"
          id="confirmNewPassword"
          label="Confirm New Password"
          placeholder="Confirm New Password"
          size="lg"
        />
        <Button type="submit" className="mt-6 cursor-pointer font-semibold">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
