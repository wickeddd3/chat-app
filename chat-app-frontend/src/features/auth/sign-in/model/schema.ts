import { z } from "zod";

export const SignInFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email({ pattern: z.regexes.email }),
  password: z.string().trim().min(1, "Password required").max(100),
});

export type SignInFormSchemaType = z.infer<typeof SignInFormSchema>;
