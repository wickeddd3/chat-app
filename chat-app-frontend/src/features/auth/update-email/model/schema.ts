import { z } from "zod";

export const EmailFormSchema = z.object({
  email: z.email({ pattern: z.regexes.email }),
});

export type EmailFormSchemaType = z.infer<typeof EmailFormSchema>;
