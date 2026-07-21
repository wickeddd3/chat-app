import type { OpenAPIV3 } from "openapi-types";

/**
 * Probes from `createHealthRouter`. They sit outside `/api` — no auth, no rate
 * limiter — because a load balancer has to reach them before the app is
 * willing to serve anyone.
 */
export const healthPaths: OpenAPIV3.PathsObject = {
  "/health": {
    get: {
      summary: "Liveness probe",
      description:
        "Is the process up? Deliberately dependency-free, so a transient database or Redis blip never gets the container restarted.",
      tags: ["System"],
      responses: {
        200: {
          description: "The process is running",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:15:00.000Z" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/ready": {
    get: {
      summary: "Readiness probe",
      description:
        "Can this instance serve traffic right now? Checks the database and Redis, and fails while shutting down so the load balancer drains it.",
      tags: ["System"],
      responses: {
        200: {
          description: "Every dependency is reachable",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ready" },
                  checks: {
                    type: "object",
                    properties: {
                      database: { type: "boolean", example: true },
                      redis: { type: "boolean", example: true },
                    },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:15:00.000Z" },
                },
              },
            },
          },
        },
        503: {
          description: "Shutting down, or a dependency is unreachable",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["not_ready", "shutting_down"], example: "not_ready" },
                  checks: {
                    type: "object",
                    properties: {
                      database: { type: "boolean", example: false },
                      redis: { type: "boolean", example: true },
                    },
                  },
                  timestamp: { type: "string", format: "date-time", example: "2026-06-14T16:15:00.000Z" },
                },
              },
            },
          },
        },
      },
    },
  },
};
