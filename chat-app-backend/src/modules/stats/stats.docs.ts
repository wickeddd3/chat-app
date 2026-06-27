import type { OpenAPIV3 } from "openapi-types";

export const statsPaths: OpenAPIV3.PathsObject = {
  "/api/stats/badge": {
    get: {
      summary: "Get stats for the authenticated user",
      description: "Retrieves unread messages and notifications with received connection requests count.",
      tags: ["Stats"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Stats retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Stats retrieved successfully" },
                  data: {
                    type: "object",
                    properties: {
                      unreadMessagesCount: { type: "integer", example: 1 },
                      unreadNotificationsCount: { type: "integer", example: 3 },
                      pendingRequestsCount: { type: "integer", example: 5 },
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
};
