import { z } from "zod";

export const syncSnapshotQuerySchema = z.object({
  // Optional active channel to self-heal; a numeric id when present.
  channelId: z.string().regex(/^\d+$/, "channelId must be a positive integer").optional(),
});
