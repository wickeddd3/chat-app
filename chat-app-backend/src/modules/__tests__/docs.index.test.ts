jest.mock("@/lib/prisma", () => ({ prisma: {} }));
// Resolving the container reaches the socket auth middleware, and `jose` ships
// ESM that this project's jest transform won't take.
jest.mock("@/lib/jwt", () => ({ verifySupabaseToken: jest.fn() }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

import type { Router } from "express";
import { container } from "@/config/inversify.config";
import { ROUTER_TYPES } from "@/config/routers";
import { HttpRouter } from "@/interfaces/router.interface";
import { combinedPaths, combinedSchemas } from "@/modules/docs.index";

interface RouteLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

/** Express writes params as `:id`; OpenAPI wants `{id}`. */
const toOpenApiPath = (path: string) => `/api${path.replace(/:([^/]+)/g, "{$1}")}`;

/** Every route actually mounted under `/api`, as "METHOD path" pairs. */
function mountedRoutes(): string[] {
  const routes: string[] = [];

  for (const type of ROUTER_TYPES) {
    const { router } = container.get<HttpRouter>(type);
    const stack = (router as Router & { stack: RouteLayer[] }).stack;

    for (const layer of stack) {
      if (!layer.route) continue;

      for (const [method, enabled] of Object.entries(layer.route.methods)) {
        if (enabled) routes.push(`${method.toUpperCase()} ${toOpenApiPath(layer.route.path)}`);
      }
    }
  }

  return routes;
}

/** Every route the OpenAPI document describes, in the same shape. */
function documentedRoutes(): string[] {
  const routes: string[] = [];

  for (const [path, operations] of Object.entries(combinedPaths)) {
    for (const method of Object.keys(operations ?? {})) {
      routes.push(`${method.toUpperCase()} ${path}`);
    }
  }

  return routes;
}

describe("OpenAPI document", () => {
  // The failure this guards against is silent: an endpoint ships, nobody
  // touches the docs, and the gap only surfaces when someone goes looking for
  // it in /api-docs. Presence lived undocumented that way.
  it("documents every route mounted under /api", () => {
    const documented = new Set(documentedRoutes());
    const undocumented = mountedRoutes().filter((route) => !documented.has(route));

    expect(undocumented).toEqual([]);
  });

  it("describes no route that isn't mounted", () => {
    const mounted = new Set(mountedRoutes());
    // The probes are mounted outside /api by createHealthRouter, so they are
    // legitimately absent from the router list this walks.
    const outsideApi = new Set(["GET /health", "GET /ready"]);

    const phantom = documentedRoutes().filter((route) => !mounted.has(route) && !outsideApi.has(route));

    expect(phantom).toEqual([]);
  });

  it("resolves every schema reference it makes", () => {
    const defined = new Set(Object.keys(combinedSchemas));
    const referenced = new Set<string>();

    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (!node || typeof node !== "object") return;

      for (const [key, value] of Object.entries(node)) {
        if (key === "$ref" && typeof value === "string") {
          referenced.add(value.replace("#/components/schemas/", ""));
        } else {
          walk(value);
        }
      }
    };

    walk(combinedPaths);
    walk(combinedSchemas);

    // A $ref to a schema that was renamed or never written renders as an empty
    // box in Swagger UI rather than an error, so nothing flags it at runtime.
    const dangling = [...referenced].filter((name) => !defined.has(name));

    expect(dangling).toEqual([]);
  });
});
