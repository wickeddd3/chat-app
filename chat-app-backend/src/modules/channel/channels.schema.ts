import { z } from "zod";

export const listChannelsQuerySchema = z.object({
  cursor: z.string().optional(),
  query: z.string().optional(),
  filter: z.enum(["all", "unread", "groups"]).optional().default("all"),
});

export const channelIdParamsSchema = z.object({
  channelId: z.uuid("channelId must be a valid UUID"),
});

export const targetUserIdParamsSchema = z.object({
  targetUserId: z.string().min(1, "targetUserId is required"),
});

export const groupChannelBodySchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(100),
  memberIds: z.array(z.string().min(1)).default([]),
});

/** `null` clears the group avatar back to the initials fallback. */
export const groupAvatarBodySchema = z.object({
  image: z.string().trim().min(1, "Image is required").nullable(),
});
