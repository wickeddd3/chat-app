import { TextField } from "@/shared/ui/form-fields/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EmailFormSchema, type EmailFormSchemaType } from "../model/schema";
import { useEmail } from "../model/useEmail";
import { useEffect } from "react";

export function EmailForm({ email }: { email: string }) {
  const form = useForm<EmailFormSchemaType>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const { updateAccountEmail } = useEmail();

  async function onSubmit(data: EmailFormSchemaType) {
    await updateAccountEmail(data);
  }

  useEffect(() => {
    form.reset({
      email: email,
    });
  }, [email, form]);

  return (
    <form id="email-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <TextField
          control={form.control}
          name="email"
          id="email"
          label="Email"
          placeholder="Email"
          inputClassName="rounded-xl md:rounded-2xl py-5 md:py-7 px-3 md:px-4 text-sm placeholder:font-medium"
          labelClassName="text-md"
        />
        <button className="bg-blue-500 rounded-xl p-3 text-white font-bold cursor-pointer mt-6 hover:bg-blue-600">
          Save Changes
        </button>
      </div>
    </form>
  );
}
