import { z } from "zod";

export const messagesParamsSchema = z.object({
  channelId: z.uuid("channelId must be a valid UUID"),
});

export const messagesQuerySchema = z.object({
  // Opaque keyset cursor (base64url); omitted means "from the latest".
  cursor: z.string().optional(),
});
