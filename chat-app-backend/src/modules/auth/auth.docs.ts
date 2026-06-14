import type { OpenAPIV3 } from "openapi-types";

export const authSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  User: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
      username: { type: "string", example: "john_doe888" },
      name: { type: "string", example: "John Doe" },
      image: { type: "string", nullable: true, example: "https://example.com/avatar.png" },
      lastSeen: {
        type: "string",
        nullable: true,
        format: "date-time",
        example: "2026-06-14T12:00:00.000Z",
      },
      createdAt: { type: "string", format: "date-time", example: "2026-06-14T12:00:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-06-14T13:45:00.000Z" },
    },
  },
};

export const authPaths: OpenAPIV3.PathsObject = {
  "/api/auth": {
    get: {
      summary: "Get currently authenticated user profile",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "User profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User profile retrieved successfully" },
                  data: { $ref: "#/components/schemas/User" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T12:00:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized - Token missing, expired, or invalid" },
        404: { description: "Not Found - User profile record does not exist" },
      },
    },
  },

  "/api/auth/sign-up": {
    post: {
      summary: "Sign up and create a user profile",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password", "username", "name"],
              properties: {
                email: { type: "string", format: "email", example: "user@example.com" },
                password: { type: "string", minLength: 1, example: "securePassword123" },
                username: { type: "string", minLength: 1, example: "john_doe888" },
                name: { type: "string", minLength: 1, example: "John Doe" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User profile created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User created successfully." },
                  data: { $ref: "#/components/schemas/User" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T12:00:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - Invalid payload data or user already exists" },
      },
    },
  },

  "/api/auth/profile": {
    post: {
      summary: "Update user profile metadata",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  example: "John Doe",
                },
                username: { type: "string", example: "john_doe888" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User profile updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User profile updated successfully." },
                  data: { $ref: "#/components/schemas/User" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T12:00:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - Body validation mismatch via ProfileSchema" },
        401: { description: "Unauthorized - Access token missing or invalid" },
      },
    },
  },

  "/api/auth/image": {
    post: {
      summary: "Update user profile display avatar",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["image"],
              properties: {
                image: {
                  type: "string",
                  description: "Base64 encoded payload string or content asset URL destination",
                  example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User image updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User image updated successfully." },
                  data: { $ref: "#/components/schemas/User" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T12:00:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - Missing or malformed image property data field" },
        401: { description: "Unauthorized - Access token missing or invalid" },
      },
    },
  },
};
