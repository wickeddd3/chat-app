import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().min(1, "Email is required").email({ pattern: z.regexes.email }),
  username: z
    .string()
    .trim()
    .min(5, "Username is required")
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, and hyphens"),
  password: z.string().trim().min(8, "Password must be at least 8 characters long").max(100),
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
