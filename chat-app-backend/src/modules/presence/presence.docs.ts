import type { OpenAPIV3 } from "openapi-types";

export const presenceSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  PresenceMap: {
    type: "object",
    description:
      "Presence keyed by user id, covering the caller's contacts plus the members of the channel they're viewing. Each entry carries an online/offline status and, for offline users, the ISO timestamp they were last seen (null while online, or when no last-seen has been recorded). Users the caller can't see are absent rather than reported offline.",
    additionalProperties: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["online", "offline"] },
        lastSeen: { type: "string", format: "date-time", nullable: true },
      },
      required: ["status", "lastSeen"],
    },
    example: {
      "d3b07384-d113-4956-a5e2-aa5913e8a213": { status: "online", lastSeen: null },
      "f8c2a917-4b6d-42e1-9c33-7e1b5d9a2f04": { status: "offline", lastSeen: "2026-06-14T16:10:00.000Z" },
    },
  },
};

export const presencePaths: OpenAPIV3.PathsObject = {
  "/api/presence/sync-snapshot": {
    get: {
      summary: "Get the current online state of everyone the caller can see",
      description:
        "Returns a one-shot snapshot to seed the UI, after which changes arrive over the websocket as `connection:status_change`. Presence is held in Redis on a heartbeat lease; if the caller's lookup graph has expired, this rebuilds it from the database before answering, so the endpoint is also the self-healing path after a cache loss.",
      tags: ["Presence"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "channelId",
          in: "query",
          required: false,
          description:
            "The channel the caller is currently viewing. Its members are folded into the snapshot, and its roster cache is rebuilt if missing.",
          schema: { type: "string", format: "uuid", example: "4b8f9a10-2c5d-4a7e-9f31-0d2b6c8e4a52" },
        },
      ],
      responses: {
        200: {
          description: "Presence snapshot compiled",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Presence view state synced successfully" },
                  data: { $ref: "#/components/schemas/PresenceMap" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:15:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - channelId was supplied but is not a valid UUID" },
        401: { description: "Unauthorized - Bearer token missing, expired, or structural invalidation" },
      },
    },
  },
};
