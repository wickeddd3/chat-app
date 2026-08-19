import type { OpenAPIV3 } from "openapi-types";

export const channelsSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Channel: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "4b8f9a10-2c5d-4a7e-9f31-0d2b6c8e4a52" },
      displayName: { type: "string", example: "Project Discussion" },
      displayImage: { type: "string", nullable: true, example: "https://example.com/avatar.png" },
      type: { type: "string", enum: ["DIRECT", "GROUP"], example: "DIRECT" },
      unreadCount: { type: "integer", example: 3 },
      channelMembers: {
        type: "array",
        items: { $ref: "#/components/schemas/ChannelMember" },
      },
      lastMessage: { $ref: "#/components/schemas/LastMessage" },
      canMessage: {
        type: "boolean",
        description:
          "Whether the viewer may post here. Always true for groups; false for a direct channel whose members " +
          "are no longer connected — the history stays readable, but the composer is closed.",
        example: true,
      },
      recipient: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
          username: { type: "string", example: "john_doe888" },
          name: { type: "string", example: "John Doe" },
          image: { type: "string", nullable: true, example: "https://example.com/avatar.png" },
        },
      },
    },
  },
  ChannelMember: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", example: "e5c17384-d113-4956-a5e2-aa5913e8a244" },
      userId: { type: "string", format: "uuid", example: "d3b07384-d113-4956-a5e2-aa5913e8a213" },
      role: { type: "string", enum: ["MEMBER", "ADMIN"], example: "MEMBER" },
      joinedAt: { type: "string", format: "date-time", example: "2026-06-14T14:15:00.000Z" },
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
  LastMessage: {
    type: "object",
    nullable: true,
    properties: {
      content: { type: "string", example: "Hey, are we still meeting today?" },
      createdAt: { type: "string", format: "date-time", example: "2026-06-14T14:00:00.000Z" },
    },
  },
};

export const channelsPaths: OpenAPIV3.PathsObject = {
  "/api/channels": {
    get: {
      summary: "Get all channels for the authenticated user",
      description:
        "Retrieves a paginated list of chat rooms (Inbox view) with cursor support and search query filtering.",
      tags: ["Channels"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "cursor",
          in: "query",
          description: "Pagination cursor token for fetching subsequent windows",
          required: false,
          schema: { type: "string", example: "eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTE0VDE0OjAwOjAwLjAwMFoifQ==" },
        },
        {
          name: "query",
          in: "query",
          description: "Search term filter to narrow down channels by name or member names",
          required: false,
          schema: { type: "string", example: "Project" },
        },
        {
          name: "filter",
          in: "query",
          description: "Tab filter: all channels, only those with unread messages, or only group channels",
          required: false,
          schema: { type: "string", enum: ["all", "unread", "groups"], default: "all" },
        },
      ],
      responses: {
        200: {
          description: "Channels fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Channels fetched successfully" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Channel" },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      limit: { type: "integer", example: 20 },
                      nextCursor: { type: "string", nullable: true, example: "eyJjcmVhdGVkQXQiOiIyMDI2..." },
                      hasMore: { type: "boolean", example: true },
                      total: { type: "integer", example: 42, description: "Total channels matching the filter" },
                    },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T14:26:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized - Access token missing or invalid" },
      },
    },
  },

  "/api/channels/{channelId}": {
    get: {
      summary: "Retrieve detailed channel records by ID",
      tags: ["Channels"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "channelId",
          in: "path",
          required: true,
          description: "The unique relational ID of the channel room",
          schema: { type: "string", format: "uuid", example: "4b8f9a10-2c5d-4a7e-9f31-0d2b6c8e4a52" },
        },
      ],
      responses: {
        200: {
          description: "Channel retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Channel retrieved successfully" },
                  data: { $ref: "#/components/schemas/Channel" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T14:26:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Channel room not found or access forbidden" },
      },
    },
  },

  "/api/channels/find/{targetUserId}": {
    get: {
      summary: "Find an existing DM or create a new one with a target user",
      tags: ["Channels"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "targetUserId",
          in: "path",
          required: true,
          description: "The unique UUID of the user you want to chat with",
          schema: { type: "string", format: "uuid", example: "e5c17384-d113-4956-a5e2-aa5913e8a244" },
        },
      ],
      responses: {
        200: {
          description: "Direct message room resolved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Channel retrieved successfully" },
                  data: { $ref: "#/components/schemas/Channel" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T14:26:00.000Z" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "Target user not found" },
      },
    },
  },

  "/api/channels/group": {
    post: {
      summary: "Create a new multi-user group channel room",
      tags: ["Channels"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "memberIds"],
              properties: {
                name: { type: "string", example: "Engineering Squad" },
                memberIds: {
                  type: "array",
                  description: "Array of user UUIDs to initialize group membership",
                  items: { type: "string", format: "uuid" },
                  example: ["e5c17384-d113-4956-a5e2-aa5913e8a244", "f7d28495-e224-5067-b6f3-bb6024f9b355"],
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Group channel created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Group channel created successfully" },
                  data: { $ref: "#/components/schemas/Channel" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T14:26:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - Group needs a name and at least one member" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/channels/group/{channelId}": {
    post: {
      summary: "Update group settings, name, or update memberships",
      tags: ["Channels"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "channelId",
          in: "path",
          required: true,
          description: "Target group room ID",
          schema: { type: "string", format: "uuid", example: "4b8f9a10-2c5d-4a7e-9f31-0d2b6c8e4a52" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "Engineering & Product Sync" },
                memberIds: {
                  type: "array",
                  description: "Complete list of active member UUIDs (for adding/removing members)",
                  items: { type: "string", format: "uuid" },
                  example: ["e5c17384-d113-4956-a5e2-aa5913e8a244"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Group configuration updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Group channel updated successfully" },
                  data: { $ref: "#/components/schemas/Channel" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T14:26:00.000Z" },
                },
              },
            },
          },
        },
        400: { description: "Bad Request - Invalid payload data or room structural modification mismatch" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden - Only group admins can alter settings" },
      },
    },
  },

  "/api/channels/group/{channelId}/image": {
    patch: {
      summary: "Set or clear a group's avatar",
      description:
        "Admin-only. Send a public storage URL to set the avatar, or null to clear it back to the initials fallback.",
      tags: ["Channels"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "channelId",
          in: "path",
          required: true,
          description: "The unique group channel ID",
          schema: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
        },
      ],
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
                  nullable: true,
                  description: "Public URL of the uploaded image, or null to remove it",
                  example: "https://example.supabase.co/storage/v1/object/public/avatars/abc.png",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Group avatar updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Group avatar updated successfully" },
                  data: { $ref: "#/components/schemas/Channel" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden - Only group admins can change the avatar" },
        422: { description: "Validation failed" },
      },
    },
  },

  "/api/channels/group/{channelId}/members/me": {
    delete: {
      summary: "Leave a group channel",
      description:
        "Removes the caller from the group. If they were its last admin, the longest-standing remaining member " +
        "inherits ADMIN; if they were its last member, the channel and its messages are deleted. Otherwise a " +
        "system message records the departure for the members who stayed.",
      tags: ["Channels"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "channelId",
          in: "path",
          required: true,
          description: "The unique group channel ID",
          schema: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
        },
      ],
      responses: {
        200: {
          description: "Left group successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Left group successfully" },
                  data: {
                    type: "object",
                    properties: {
                      channelId: { type: "string", example: "b1a23c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
                      channelDeleted: {
                        type: "boolean",
                        description: "True when the caller was the last member and the channel was removed",
                        example: false,
                      },
                    },
                  },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Not a member of this channel" },
        404: { description: "Channel not found" },
        422: { description: "Not a group channel - a direct channel is dissolved by removing the contact" },
      },
    },
  },
};
