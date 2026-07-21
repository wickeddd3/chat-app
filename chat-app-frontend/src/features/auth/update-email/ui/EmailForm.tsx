import { Button } from "@/shared/ui/shadcn/button";
import { TextField } from "@/shared/ui/form-fields/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EmailFormSchema, type EmailFormSchemaType } from "../model/schema";
import { useEmail } from "../model/useEmail";
import { useEffect } from "react";

export interface EmailFormProps {
  email: string;
}

export function EmailForm({ email }: EmailFormProps) {
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
          size="lg"
        />
        <Button type="submit" className="mt-6 cursor-pointer font-semibold">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
