import type { Connection } from "@/prisma/client";
import {
  assertCanAccept,
  assertCanCancel,
  assertCanDecline,
  assertCanRemoveContact,
  assertNoExistingConnection,
  assertNotSelfConnection,
} from "@/modules/connection/connections.policy";

// The policy is pure — no Prisma, no container, no mocks. That is the point of
// having lifted these rules out of the repository.
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

function buildConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: "c1",
    senderId: "sender",
    receiverId: "receiver",
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Connection;
}

describe("connections policy", () => {
  describe("assertNotSelfConnection", () => {
    it("rejects a request to yourself as a validation failure", () => {
      expect(() => assertNotSelfConnection("me", "me")).toThrow(expect.objectContaining({ code: "VALIDATION" }));
    });

    it("allows a request to anyone else", () => {
      expect(() => assertNotSelfConnection("me", "you")).not.toThrow();
    });
  });

  describe("assertNoExistingConnection", () => {
    it("rejects a second connection for the same pair as a conflict", () => {
      expect(() => assertNoExistingConnection(buildConnection())).toThrow(
        expect.objectContaining({ code: "CONFLICT" }),
      );
    });

    it("allows the first connection for a pair", () => {
      expect(() => assertNoExistingConnection(null)).not.toThrow();
    });
  });

  describe("assertCanAccept", () => {
    it("allows the addressee", () => {
      expect(() => assertCanAccept(buildConnection(), "receiver")).not.toThrow();
    });

    it("forbids anyone who is not the addressee", () => {
      expect(() => assertCanAccept(buildConnection(), "intruder")).toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("reports a missing connection as not found", () => {
      expect(() => assertCanAccept(null, "receiver")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
    });
  });

  describe("assertCanDecline", () => {
    it("allows the addressee while the request is pending", () => {
      expect(() => assertCanDecline(buildConnection(), "receiver")).not.toThrow();
    });

    it("forbids the sender from declining their own request", () => {
      expect(() => assertCanDecline(buildConnection(), "sender")).toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("refuses once the request is no longer pending", () => {
      expect(() => assertCanDecline(buildConnection({ status: "ACCEPTED" }), "receiver")).toThrow(
        expect.objectContaining({ code: "CONFLICT" }),
      );
    });

    it("reports a missing connection as not found", () => {
      expect(() => assertCanDecline(null, "receiver")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
    });
  });

  describe("assertCanCancel", () => {
    it("allows the author while the request is pending", () => {
      expect(() => assertCanCancel(buildConnection(), "sender")).not.toThrow();
    });

    it("forbids the addressee from cancelling someone else's request", () => {
      expect(() => assertCanCancel(buildConnection(), "receiver")).toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("refuses once the request has been accepted", () => {
      expect(() => assertCanCancel(buildConnection({ status: "ACCEPTED" }), "sender")).toThrow(
        expect.objectContaining({ code: "CONFLICT" }),
      );
    });
  });

  describe("assertCanRemoveContact", () => {
    const accepted = buildConnection({ status: "ACCEPTED" });

    it("allows either party to dissolve an accepted connection", () => {
      expect(() => assertCanRemoveContact(accepted, "sender")).not.toThrow();
      expect(() => assertCanRemoveContact(accepted, "receiver")).not.toThrow();
    });

    it("forbids an outsider from removing someone else's contact", () => {
      expect(() => assertCanRemoveContact(accepted, "stranger")).toThrow(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    });

    it("reports strangers as not found", () => {
      expect(() => assertCanRemoveContact(null, "sender")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
    });

    it("refuses a pending request — that is cancelled or declined, not removed", () => {
      expect(() => assertCanRemoveContact(buildConnection(), "sender")).toThrow(
        expect.objectContaining({ code: "CONFLICT" }),
      );
    });
  });
});
