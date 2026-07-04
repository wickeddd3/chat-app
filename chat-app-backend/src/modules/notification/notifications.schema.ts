import { z } from "zod";

export const notificationsQuerySchema = z.object({
  cursor: z.string().optional(),
});

export const markAsReadBodySchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1, "notificationIds is required"),
});
