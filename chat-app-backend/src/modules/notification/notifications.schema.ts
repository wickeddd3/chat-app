import { z } from "zod";

export const notificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  filter: z.enum(["all", "unread"]).optional().default("all"),
});

export const markAsReadBodySchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1, "notificationIds is required"),
});
