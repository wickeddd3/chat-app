import { cn } from "@/shared/lib/utils";
import { TextField } from "@/shared/ui/form-fields/TextField";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/shared/ui/shadcn/field";
import { Link } from "react-router";
import { SpinnerIcon } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SignUpFormSchema, type SignUpFormSchemaType } from "../model/schema";
import { useSignUp } from "../model/useSignUp";
import { CheckEmailAlert } from "./CheckEmailAlert";

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useForm<SignUpFormSchemaType>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // The email a confirmation link was just sent to (null = alert hidden).
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );

  const { register, isPending } = useSignUp({
    onSuccess: (email) => {
      setConfirmationEmail(email);
      form.reset();
    },
  });

  async function onSubmit(data: SignUpFormSchemaType) {
    await register(data);
  }

  return (
    <>
      {confirmationEmail && (
        <CheckEmailAlert
          email={confirmationEmail}
          onDismiss={() => setConfirmationEmail(null)}
        />
      )}
      <Card className={cn("flex flex-col gap-6", className)} {...props}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            <h1>Create your account</h1>
          </CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="sign-up-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  aria-label="Sign up with google"
                  role="button"
                  title="Sign up with google"
                  disabled
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign up with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <TextField
                control={form.control}
                name="name"
                id="name"
                label="Full Name"
                placeholder="John Doe"
              />
              <TextField
                control={form.control}
                name="email"
                id="email"
                label="Email"
                placeholder="johndoe@gmail.com"
              />
              <TextField
                control={form.control}
                name="username"
                id="username"
                label="Username"
                placeholder="johndoe888"
              />
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <TextField
                    type="password"
                    control={form.control}
                    name="password"
                    autoComplete="new-password"
                    id="password"
                    label="Password"
                    placeholder="********"
                  />
                  <TextField
                    type="password"
                    control={form.control}
                    name="confirmPassword"
                    autoComplete="new-password"
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="********"
                  />
                </Field>
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="font-semibold bg-primary hover:bg-primary/90 cursor-pointer"
                  aria-label="Create an account"
                  role="button"
                  title="Create an account"
                  disabled={isPending}
                >
                  {isPending ? (
                    <SpinnerIcon className="size-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link to="/auth/sign-in">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
