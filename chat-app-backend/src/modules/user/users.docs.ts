import type { OpenAPIV3 } from "openapi-types";

export const usersSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  SuggestedUser: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
      connectionId: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a215" },
      connectionStatus: { type: "string", enum: ["PENDING", "ACCEPTED", "DECLINED"], example: "PENDING" },
      username: { type: "string", example: "john_doe888" },
      name: { type: "string", example: "John Doe" },
      image: { type: "string", nullable: true, example: "https://example.com/avatar.png" },
      mutualConnectionsCount: { type: "integer", example: 0 },
    },
  },
};

export const usersPaths: OpenAPIV3.PathsObject = {
  "/api/users": {
    get: {
      summary: "Get suggested users or search directory",
      description:
        "Retrieves a curated list of user profiles for discovery or filters down matching accounts using an optional string query.",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "query",
          in: "query",
          description: "Search filter to narrow down suggestions by matching names or usernames",
          required: false,
          schema: { type: "string", example: "smith" },
        },
      ],
      responses: {
        200: {
          description: "Suggested users list fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Suggested users fetched successfully" },
                  data: {
                    type: "array",
                    description: "Collection of matching public user profiles",
                    items: { $ref: "#/components/schemas/SuggestedUser" },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:40:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized - Invalid or missing access token" },
      },
    },
  },

  "/api/users/profile/{username}": {
    get: {
      summary: "Get public user profile by username",
      description: "Looks up a clean public user profile object utilizing an explicit handle path parameter variable.",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          description: "The unique alphanumeric username handle belonging to the target account",
          schema: { type: "string", example: "john_doe888" },
        },
      ],
      responses: {
        200: {
          description: "User profile record fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User profile retrieved successfully" },
                  data: { $ref: "#/components/schemas/User" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:40:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: {
          description:
            "Not Found - Matches your custom NotFoundException when a user profile handle cannot be resolved",
        },
      },
    },
  },
};
