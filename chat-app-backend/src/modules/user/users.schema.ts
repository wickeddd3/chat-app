import { z } from "zod";

export const suggestedUsersQuerySchema = z.object({
  query: z.string().optional(),
});

export const usernameParamsSchema = z.object({
  username: z
    .string()
    .min(1, "username is required")
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid username"),
});
