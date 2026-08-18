import { z } from "zod";

export const connectionsListQuerySchema = z.object({
  cursor: z.string().optional(),
  query: z.string().optional(),
});

export const connectionRequestBodySchema = z.object({
  receiverId: z.string().min(1, "receiverId is required"),
});

export const connectionIdParamsSchema = z.object({
  id: z.string().min(1, "connection id is required"),
});

/** Removing a contact addresses the other *user*, not the connection row. */
export const contactUserIdParamsSchema = z.object({
  userId: z.string().min(1, "user id is required"),
});
