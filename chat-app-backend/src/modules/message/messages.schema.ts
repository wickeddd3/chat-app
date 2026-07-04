import { z } from "zod";

export const messagesParamsSchema = z.object({
  channelId: z.uuid("channelId must be a valid UUID"),
});

export const messagesQuerySchema = z.object({
  // Cursor is a message id (uuid) when present; omitted means "from the start".
  cursor: z.uuid("cursor must be a valid UUID").optional(),
});
