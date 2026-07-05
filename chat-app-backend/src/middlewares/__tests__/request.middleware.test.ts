import express from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "@/middlewares/request.middleware";
import { errorMiddleware } from "@/middlewares/error.middleware";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post("/test", validate({ body: z.object({ name: z.string().min(1, "Name is required") }) }), (_req, res) => {
    res.json({ ok: true, body: _req.body });
  });
  app.get(
    "/items/:id",
    validate({ params: z.object({ id: z.string().regex(/^\d+$/, "id must be numeric") }) }),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
  app.use(errorMiddleware);
  return app;
}

describe("validate middleware", () => {
  it("rejects an invalid body with 400 and flattened field issues", async () => {
    const res = await request(buildApp()).post("/test").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Failed");
    expect(res.body.details).toEqual([{ field: "name", message: "Name is required" }]);
  });

  it("passes a valid body and strips unknown keys", async () => {
    const res = await request(buildApp()).post("/test").send({ name: "Jane", isAdmin: true });
    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: "Jane" });
  });

  it("gates invalid path params with 400", async () => {
    const res = await request(buildApp()).get("/items/abc");
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual([{ field: "id", message: "id must be numeric" }]);
  });

  it("passes valid path params", async () => {
    const res = await request(buildApp()).get("/items/42");
    expect(res.status).toBe(200);
  });
});
