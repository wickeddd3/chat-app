import { z } from "zod";

export const ProfileFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  username: z
    .string()
    .trim()
    .min(5, "Username is required")
    .max(100)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain alphanumeric characters, underscores, and hyphens",
    ),
});

export type ProfileFormSchemaType = z.infer<typeof ProfileFormSchema>;
