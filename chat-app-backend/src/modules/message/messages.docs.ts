import type { OpenAPIV3 } from "openapi-types";

export const messagesSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Message: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1024 },
      parentId: { type: "integer", nullable: true, example: 1000 },
      channelId: { type: "integer", example: 42 },
      authorId: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
      content: { type: "string", example: "Hey everyone! Check out the new API documentation architecture." },
      createdAt: { type: "string", format: "date-time", example: "2026-06-14T16:00:00.000Z" },
      author: { $ref: "#/components/schemas/User" },
    },
  },
};

export const messagesPaths: OpenAPIV3.PathsObject = {
  "/api/messages/{channelId}": {
    get: {
      summary: "Get message history for a specific channel room",
      description:
        "Retrieves a paginated list of historical chat messages inside a chat group or direct message channel room using sequentially indexed integer cursor lookups.",
      tags: ["Messages"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "channelId",
          in: "path",
          required: true,
          description: "The unique relational database ID of the target channel",
          schema: { type: "integer", example: 42 },
        },
        {
          name: "cursor",
          in: "query",
          description:
            "The integer relational boundary token (typically the oldest message ID fetched in the current batch) used to locate the next chronological window block",
          required: false,
          schema: { type: "integer", example: 1044 },
        },
      ],
      responses: {
        200: {
          description: "Messages history ledger window fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Messages fetched successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Message" },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      limit: { type: "integer", example: 20 },
                      nextCursor: { type: "integer", nullable: true, example: 1024 },
                      hasMore: { type: "boolean", example: true },
                    },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:15:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized - Bearer token missing, expired, or structural invalidation" },
        403: { description: "Forbidden - Authenticated principal is not an authorized group participant" },
        404: { description: "Not Found - Targeted channel room record entity does not exist" },
      },
    },
  },
};
