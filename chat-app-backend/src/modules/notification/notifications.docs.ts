import type { OpenAPIV3 } from "openapi-types";

export const notificationsSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Notification: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" },
      userId: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
      referenceId: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a123" },
      type: {
        type: "string",
        enum: ["NEW_MESSAGE", "CONNECTION_REQUEST", "CONNECTION_ACCEPTED"],
        example: "NEW_MESSAGE",
      },
      title: { type: "string", example: "New Message" },
      content: { type: "string", example: "John Doe sent you a message in Engineering Squad." },
      isRead: { type: "boolean", example: false },
      createdAt: { type: "string", format: "date-time", example: "2026-06-14T16:20:00.000Z" },
    },
  },
};

export const notificationsPaths: OpenAPIV3.PathsObject = {
  "/api/notifications": {
    get: {
      summary: "Get notifications for the authenticated user",
      description:
        "Retrieves a paginated feed of the user's incoming push and in-app notifications with cursor-based pagination.",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "cursor",
          in: "query",
          description: "Pagination cursor token used to fetch subsequent windows of historical notification records",
          required: false,
          schema: { type: "string", example: "eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTE0VDE2..." },
        },
        {
          name: "filter",
          in: "query",
          description: "Tab filter: all notifications, or only unread ones",
          required: false,
          schema: { type: "string", enum: ["all", "unread"], default: "all" },
        },
      ],
      responses: {
        200: {
          description: "Notifications feed fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Notifications fetched successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Notification" },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      limit: { type: "integer", example: 20 },
                      nextCursor: {
                        type: "string",
                        nullable: true,
                        example: "eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTE0VDE1...",
                      },
                      hasMore: { type: "boolean", example: true },
                      total: { type: "integer", example: 42, description: "Total notifications matching the filter" },
                    },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:25:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized - Bearer token missing, expired, or invalid" },
      },
    },
  },

  "/api/notifications/mark-as-read": {
    post: {
      summary: "Mark specified notifications as read",
      description: "Accepts an array of notification item IDs to update their active reading markers state globally.",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["notificationIds"],
              properties: {
                notificationIds: {
                  type: "array",
                  description: "List of notification item UUID entities to update",
                  items: { type: "string", format: "uuid" },
                  example: ["a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", "f7d28495-e224-5067-b6f3-bb6024f9b355"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Notifications updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Notifications mark as read successfully" },
                  data: {
                    type: "array",
                    description: "The updated list of notification entities",
                    items: { $ref: "#/components/schemas/Notification" },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:25:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - Missing or malformed notificationIds array" },
        401: { description: "Unauthorized" },
      },
    },
  },
};
