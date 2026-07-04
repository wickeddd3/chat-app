import { z } from "zod";

export const syncSnapshotQuerySchema = z.object({
  // Optional active channel to self-heal; a uuid when present.
  channelId: z.uuid("channelId must be a valid UUID").optional(),
});
