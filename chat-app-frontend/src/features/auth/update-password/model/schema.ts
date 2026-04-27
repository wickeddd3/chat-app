import { z } from "zod";

export const PasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .trim()
      .min(8, "Current Password must be at least 8 characters long")
      .max(100),
    newPassword: z
      .string()
      .trim()
      .min(8, "New Password must be at least 8 characters long")
      .max(100),
    confirmNewPassword: z
      .string()
      .trim()
      .min(8, "Confirm New Password must be at least 8 characters long")
      .max(100),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"], // sets the error on the confirmPassword field
  });

export type PasswordFormSchemaType = z.infer<typeof PasswordFormSchema>;
