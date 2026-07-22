import type { Request, Response } from "express";
import { errorMiddleware } from "@/middlewares/error.middleware";
import { HttpException } from "@/utils/http.exception";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PersistenceError,
  ValidationError,
} from "@/shared/errors/domain.error";

function buildRes() {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

function buildReq() {
  return {
    method: "POST",
    url: "/api/connections",
    log: { error: jest.fn() },
  } as unknown as Request;
}

function handle(error: Error) {
  const req = buildReq();
  const res = buildRes();
  errorMiddleware(error, req, res, jest.fn());

  return {
    status: (res.status as jest.Mock).mock.calls[0]?.[0] as number,
    body: (res.json as jest.Mock).mock.calls[0]?.[0] as Record<string, unknown>,
    logged: (req.log.error as jest.Mock).mock.calls.length > 0,
  };
}

describe("errorMiddleware", () => {
  describe("domain error mapping", () => {
    // The whole point of the domain-error vocabulary: these used to reach the
    // client as indistinguishable 500s.
    it.each([
      [new NotFoundError("Connection request not found."), 404],
      [new ForbiddenError("You cannot decline a request addressed to someone else."), 403],
      [new ConflictError("A connection with this user already exists."), 409],
      [new ValidationError("You cannot send a connection request to yourself."), 422],
      [new PersistenceError("Failed to load the connection."), 500],
    ])("maps %s to its status", (error, expected) => {
      const { status, body } = handle(error);

      expect(status).toBe(expected);
      expect(body).toMatchObject({ success: false, message: error.message });
    });

    it("passes domain error details through to the client", () => {
      const { body } = handle(new ValidationError("Invalid", [{ field: "receiverId" }]));

      expect(body.details).toEqual([{ field: "receiverId" }]);
    });

    it("omits the details key entirely when there are none", () => {
      const { body } = handle(new NotFoundError("Gone"));

      expect(body).not.toHaveProperty("details");
    });
  });

  describe("boundary and unknown errors", () => {
    it("keeps the status of an HttpException (zod validation at the boundary)", () => {
      const { status, body } = handle(new HttpException(400, "Validation Failed", [{ field: "receiverId" }]));

      expect(status).toBe(400);
      expect(body).toMatchObject({ message: "Validation Failed", details: [{ field: "receiverId" }] });
    });

    it("falls back to a generic 500 for an unrecognised error, leaking nothing", () => {
      const { status, body } = handle(new Error("connect ECONNREFUSED 10.0.0.5:5432"));

      expect(status).toBe(500);
      expect(body.message).toBe("An unexpected internal server error occurred");
    });
  });

  describe("logging", () => {
    it("logs server-side failures with the full error", () => {
      expect(handle(new PersistenceError("Failed to load the connection.")).logged).toBe(true);
    });

    it("does not log expected client errors", () => {
      expect(handle(new ForbiddenError("Nope")).logged).toBe(false);
      expect(handle(new NotFoundError("Gone")).logged).toBe(false);
    });
  });
});
