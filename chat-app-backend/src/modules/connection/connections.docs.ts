import type { OpenAPIV3 } from "openapi-types";

export const connectionsSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ConnectionRequest: {
    type: "object",
    properties: {
      id: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
      status: { type: "string", enum: ["PENDING", "ACCEPTED", "DECLINED"], example: "PENDING" },
      createdAt: { type: "string", format: "date-time", example: "2026-06-14T12:00:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-06-14T12:00:00.000Z" },
      user: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
          username: { type: "string", example: "john_doe888" },
          name: { type: "string", example: "John Doe" },
          image: { type: "string", nullable: true, example: "https://example.com/avatar.png" },
        },
      },
    },
  },
};

export const connectionsPaths: OpenAPIV3.PathsObject = {
  "/api/connections/contacts": {
    get: {
      summary: "Get all accepted contacts/friends for the authenticated user",
      tags: ["Connections"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "cursor",
          in: "query",
          description: "Pagination cursor token",
          required: false,
          schema: { type: "string", example: "eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTE0..." },
        },
        {
          name: "query",
          in: "query",
          description: "Search term filter to narrow down contacts by name or username",
          required: false,
          schema: { type: "string", example: "john" },
        },
      ],
      responses: {
        200: {
          description: "Contacts fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Contacts fetched successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      limit: { type: "integer", example: 20 },
                      nextCursor: { type: "string", nullable: true, example: "eyJjcmVhdGVkQXQiOiIyMDI2..." },
                      hasMore: { type: "boolean", example: true },
                      total: { type: "integer", example: 42, description: "Total contacts matching the search" },
                    },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T15:00:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/connections/sent": {
    get: {
      summary: "Get pending connection requests sent by the authenticated user",
      tags: ["Connections"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "cursor",
          in: "query",
          description: "Pagination cursor token",
          required: false,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Sent connection requests fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Sent connection requests fetched successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ConnectionRequest" },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      limit: { type: "integer", example: 20 },
                      nextCursor: { type: "string", nullable: true },
                      hasMore: { type: "boolean", example: false },
                    },
                  },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/connections/received": {
    get: {
      summary: "Get pending connection requests received by the authenticated user",
      tags: ["Connections"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "cursor",
          in: "query",
          description: "Pagination cursor token",
          required: false,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Received connection requests fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Received connection requests fetched successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ConnectionRequest" },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      limit: { type: "integer", example: 20 },
                      nextCursor: { type: "string", nullable: true },
                      hasMore: { type: "boolean", example: false },
                    },
                  },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/connections/request": {
    post: {
      summary: "Send a new connection request to a target user",
      tags: ["Connections"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["receiverId"],
              properties: {
                receiverId: { type: "string", format: "uuid", example: "e5c17384-d113-4956-a5e2-aa5913e8a244" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Connection request sent successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Connection request sent successfully" },
                  data: {
                    $ref: "#/components/schemas/ConnectionRequest",
                  },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - Invalid payload data or request already exists" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/connections/request/{id}/accept": {
    post: {
      summary: "Accept an incoming connection request",
      tags: ["Connections"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "The unique connection request ID",
          schema: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
        },
      ],
      responses: {
        200: {
          description: "Connection request accepted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Connection request accepted successfully" },
                  data: {
                    $ref: "#/components/schemas/ConnectionRequest",
                  },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Connection request record not found" },
      },
    },
  },

  "/api/connections/request/{id}/decline": {
    post: {
      summary: "Decline an incoming connection request",
      tags: ["Connections"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "The unique connection request ID",
          schema: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
        },
      ],
      responses: {
        200: {
          description: "Connection request declined successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Connection request declined successfully" },
                  data: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Connection request record not found" },
      },
    },
  },

  "/api/connections/request/{id}/cancel": {
    post: {
      summary: "Cancel a pending sent connection request",
      tags: ["Connections"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "The unique connection request ID",
          schema: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
        },
      ],
      responses: {
        200: {
          description: "Connection request canceled successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Connection request canceled successfully" },
                  data: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Connection request record not found" },
      },
    },
  },
};
