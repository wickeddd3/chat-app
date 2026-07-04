import { z } from "zod";

// A channel id is a positive integer surfaced as a path string (repo parseInts it).
const numericId = z.string().regex(/^\d+$/, "channelId must be a positive integer");

export const listChannelsQuerySchema = z.object({
  cursor: z.string().optional(),
  query: z.string().optional(),
});

export const channelIdParamsSchema = z.object({
  channelId: numericId,
});

export const targetUserIdParamsSchema = z.object({
  targetUserId: z.string().min(1, "targetUserId is required"),
});

export const groupChannelBodySchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(100),
  memberIds: z.array(z.string().min(1)).default([]),
});
