import type { OpenAPIV3 } from "openapi-types";

export const messagesSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Message: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "9f1c2b40-6f2e-4f2a-9a11-8a6a2b5f0c31" },
      parentId: { type: "string", format: "uuid", nullable: true, example: null },
      channelId: { type: "string", format: "uuid", example: "4b8f9a10-2c5d-4a7e-9f31-0d2b6c8e4a52" },
      authorId: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
      content: { type: "string", example: "Hey everyone! Check out the new API documentation architecture." },
      createdAt: { type: "string", format: "date-time", example: "2026-06-14T16:00:00.000Z" },
      readCount: {
        type: "integer",
        example: 1,
        description:
          "Recipients who have read this message. An author never receives a receipt for their own message, so any value above zero means it has been read.",
      },
      author: { $ref: "#/components/schemas/User" },
      parent: {
        nullable: true,
        description:
          "The quoted message, when this message is a reply. A snapshot carried on the reply so the quote renders without a second fetch; shallow, so a reply to a reply carries only its own parent.",
        allOf: [{ $ref: "#/components/schemas/MessageParent" }],
      },
    },
  },
  MessageParent: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "7a3d1e20-4b8c-4d1f-8e22-5c9f3a1b7d64" },
      content: { type: "string", example: "Did the migration land on prod yet?" },
      type: { type: "string", enum: ["USER", "SYSTEM"], example: "USER" },
      author: { $ref: "#/components/schemas/User" },
    },
  },
};

export const messagesPaths: OpenAPIV3.PathsObject = {
  "/api/messages/{channelId}": {
    get: {
      summary: "Get message history for a specific channel room",
      description:
        "Retrieves a page of a channel's history, newest first, using an opaque keyset cursor. Pass the `nextCursor` from the previous response to walk further back; omit it to start from the latest message.",
      tags: ["Messages"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "channelId",
          in: "path",
          required: true,
          description: "The channel to read",
          schema: { type: "string", format: "uuid", example: "4b8f9a10-2c5d-4a7e-9f31-0d2b6c8e4a52" },
        },
        {
          name: "cursor",
          in: "query",
          description:
            "Opaque base64url keyset cursor taken from the previous response's `nextCursor`. Encodes the boundary message's timestamp and id — it is not an offset or an id, and should be passed back unmodified.",
          required: false,
          schema: {
            type: "string",
            example: "eyJ0IjoiMjAyNi0wNi0xNFQxNjowMDowMC4wMDBaIiwiaSI6IjlmMWMyYjQwIn0",
          },
        },
      ],
      responses: {
        200: {
          description: "A page of message history, oldest first",
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
                      nextCursor: {
                        type: "string",
                        nullable: true,
                        description: "Pass as `cursor` to fetch the next (older) page. Null on the last page.",
                        example: "eyJ0IjoiMjAyNi0wNi0xNFQxNTowMDowMC4wMDBaIiwiaSI6IjdhM2QxZTIwIn0",
                      },
                      hasMore: { type: "boolean", example: true },
                    },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:15:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - channelId is not a valid UUID" },
        401: { description: "Unauthorized - Bearer token missing, expired, or structural invalidation" },
        403: { description: "Forbidden - Authenticated principal is not an authorized group participant" },
        404: { description: "Not Found - Targeted channel room record entity does not exist" },
      },
    },
  },
};
