import { TextField } from "@/shared/ui/form-fields/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EmailFormSchema, type EmailFormSchemaType } from "../model/schema";
import { useEmail } from "../model/useEmail";
import { toast } from "sonner";
import { useEffect } from "react";

export function EmailForm({ email }: { email: string }) {
  const form = useForm<EmailFormSchemaType>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const { updateEmail } = useEmail();

  async function onSubmit(data: EmailFormSchemaType) {
    const response = await updateEmail(data);

    if (response.error) {
      toast.error("Email update failed", {
        description:
          response?.error?.message || "Error occurred while updating email",
        position: "bottom-right",
      });
      return;
    }

    toast.success("Email updated successfully", {
      position: "bottom-right",
    });
  }

  useEffect(() => {
    form.reset({
      email: email,
    });
  }, [email]);

  return (
    <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <TextField
          control={form.control}
          name="email"
          id="email"
          label="Email"
          placeholder="Email"
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
