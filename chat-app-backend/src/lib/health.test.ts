import express from "express";
import request from "supertest";

// Mock infra so no real DB/Redis connection is made (the real modules also load
// app.config; the mocks replace them entirely).
jest.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: jest.fn() } }));
jest.mock("@/lib/redis", () => ({ redisClient: { ping: jest.fn() } }));

import { prisma } from "@/lib/prisma";
import { redisClient } from "@/lib/redis";
import { createHealthRouter } from "@/lib/health";

const mockPrisma = prisma as unknown as { $queryRaw: jest.Mock };
const mockRedis = redisClient as unknown as { ping: jest.Mock };

function buildApp(isShuttingDown: () => boolean = () => false) {
  const app = express();
  app.use(createHealthRouter(isShuttingDown));
  return app;
}

describe("health router", () => {
  it("GET /health returns 200 ok (dependency-free liveness)", async () => {
    const res = await request(buildApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /ready returns 200 when DB and Redis are reachable", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockRedis.ping.mockResolvedValue("PONG");
    const res = await request(buildApp()).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ready", checks: { database: true, redis: true } });
  });

  it("GET /ready returns 503 when the database is unreachable", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("db down"));
    mockRedis.ping.mockResolvedValue("PONG");
    const res = await request(buildApp()).get("/ready");
    expect(res.status).toBe(503);
    expect(res.body.checks).toEqual({ database: false, redis: true });
  });

  it("GET /ready returns 503 while shutting down (drains the load balancer)", async () => {
    const res = await request(buildApp(() => true)).get("/ready");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("shutting_down");
  });
});
