import { z } from "zod";

export const messagesParamsSchema = z.object({
  channelId: z.string().regex(/^\d+$/, "channelId must be a positive integer"),
});

export const messagesQuerySchema = z.object({
  // Cursor is a numeric message id when present; omitted means "from the start".
  cursor: z.string().regex(/^\d+$/, "cursor must be a positive integer").optional(),
});
