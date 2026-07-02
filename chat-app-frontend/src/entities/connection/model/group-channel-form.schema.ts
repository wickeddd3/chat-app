import { z } from "zod";

export const GroupChannelFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  memberIds: z.array(z.string()),
});

export type GroupChannelFormSchemaType = z.infer<typeof GroupChannelFormSchema>;
