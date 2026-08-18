import { Container } from "inversify";
import { TYPES } from "@/config/types";
import { ConnectionsService } from "@/modules/connection/connections.service";
import type { Connection } from "@/prisma/client";

// Prevent the real prisma/redis clients from being constructed when the
// repository / presence classes are imported transitively (redis connects on
// construction). The service's own deps are supplied as mocks below.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
// The repositories inject PrismaClient (referenced by decorator metadata even
// though the real classes are never instantiated) — stub it so the heavy
// generated client isn't loaded.
jest.mock("@/prisma/client", () => ({ PrismaClient: class {}, Prisma: { PrismaClientKnownRequestError: class {} } }));

function buildConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: "c1",
    senderId: "sender",
    receiverId: "receiver",
    status: "PENDING",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    ...overrides,
  } as Connection;
}

/** What the write repository returns: the row plus both parties' profiles. */
function buildConnectionWithParties(overrides: Partial<Connection> = {}) {
  return {
    ...buildConnection(overrides),
    sender: { id: "sender", name: "Sender", username: "sender", image: null },
    receiver: { id: "receiver", name: "Receiver", username: "receiver", image: null },
  };
}

describe("ConnectionsService (DI container + mocked collaborators)", () => {
  let query: { getUserContacts: jest.Mock };
  let repo: {
    findById: jest.Mock;
    findBetween: jest.Mock;
    create: jest.Mock;
    markAccepted: jest.Mock;
    delete: jest.Mock;
  };
  let notifications: { create: jest.Mock; markReadByReference: jest.Mock; deleteByReference: jest.Mock };
  let transaction: { run: jest.Mock };
  let dispatcher: { emit: jest.Mock };
  let presence: { setPresenceLookup: jest.Mock; removePresenceLookup: jest.Mock };
  let service: ConnectionsService;

  beforeEach(() => {
    query = { getUserContacts: jest.fn() };
    repo = {
      findById: jest.fn(),
      findBetween: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(buildConnectionWithParties()),
      markAccepted: jest.fn().mockResolvedValue(buildConnectionWithParties({ status: "ACCEPTED" })),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    notifications = {
      create: jest.fn().mockResolvedValue({ id: "n1", userId: "receiver" }),
      markReadByReference: jest.fn().mockResolvedValue(undefined),
      deleteByReference: jest.fn().mockResolvedValue(undefined),
    };
    // Runs the unit of work inline; the executor is never touched by the mocks.
    transaction = { run: jest.fn((work: (tx: unknown) => Promise<unknown>) => work({})) };
    dispatcher = { emit: jest.fn() };
    presence = {
      setPresenceLookup: jest.fn().mockResolvedValue(undefined),
      removePresenceLookup: jest.fn().mockResolvedValue(undefined),
    };

    // Build a throwaway container: real service, mocked collaborators.
    const container = new Container();
    container.bind(TYPES.ConnectionsQuery).toConstantValue(query);
    container.bind(TYPES.ConnectionsRepository).toConstantValue(repo);
    container.bind(TYPES.NotificationsRepository).toConstantValue(notifications);
    container.bind(TYPES.TransactionManager).toConstantValue(transaction);
    container.bind(TYPES.EventDispatcher).toConstantValue(dispatcher);
    container.bind(TYPES.PresenceService).toConstantValue(presence);
    container.bind<ConnectionsService>(TYPES.ConnectionsService).to(ConnectionsService);

    service = container.get<ConnectionsService>(TYPES.ConnectionsService);
  });

  it("delegates list reads to the query side unchanged", async () => {
    const payload = { contacts: [{ id: "u2" }], hasMore: false, nextCursor: null, total: 1 };
    query.getUserContacts.mockResolvedValue(payload);

    const result = await service.getUserContacts({ authUserId: "u1" });

    expect(result).toBe(payload);
    expect(query.getUserContacts).toHaveBeenCalledWith({ authUserId: "u1" });
  });

  it("propagates a persistence failure unchanged rather than masking it as a 500", async () => {
    const underlying = new Error("connection pool exhausted");
    query.getUserContacts.mockRejectedValue(underlying);

    await expect(service.getUserContacts({ authUserId: "u1" })).rejects.toBe(underlying);
  });

  describe("sendRequest", () => {
    it("persists the connection and its notification in one transaction, then announces", async () => {
      const result = await service.sendRequest("sender", "receiver");

      expect(transaction.run).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith({ senderId: "sender", receiverId: "receiver" }, {});
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "receiver", type: "CONNECTION_REQUEST" }),
        {},
      );
      expect(dispatcher.emit).toHaveBeenCalledWith("notification:new", result.notification);
      expect(dispatcher.emit).toHaveBeenCalledWith("request:new", {
        receiverId: "receiver",
        connection: result.receivedConnection,
      });
    });

    it("projects each direction onto the counterpart's profile", async () => {
      const result = await service.sendRequest("sender", "receiver");

      expect(result.sentConnection.user.id).toBe("receiver");
      expect(result.receivedConnection.user.id).toBe("sender");
    });

    it("refuses a self-request before touching persistence", async () => {
      await expect(service.sendRequest("same", "same")).rejects.toMatchObject({ code: "VALIDATION" });
      expect(repo.findBetween).not.toHaveBeenCalled();
      expect(transaction.run).not.toHaveBeenCalled();
    });

    it("refuses a duplicate as a conflict without opening a transaction", async () => {
      repo.findBetween.mockResolvedValue(buildConnection());

      await expect(service.sendRequest("sender", "receiver")).rejects.toMatchObject({ code: "CONFLICT" });
      expect(transaction.run).not.toHaveBeenCalled();
    });
  });

  describe("acceptRequest", () => {
    beforeEach(() => {
      repo.findById.mockResolvedValue(buildConnection());
      notifications.create.mockResolvedValue({ id: "n2", userId: "sender" });
    });

    it("retires the original request, notifies the sender and announces the acceptance", async () => {
      const result = await service.acceptRequest("receiver", "c1");

      expect(notifications.markReadByReference).toHaveBeenCalledWith({ referenceId: "c1", userId: "receiver" }, {});
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "sender", type: "CONNECTION_ACCEPTED" }),
        {},
      );
      expect(dispatcher.emit).toHaveBeenCalledWith("request:accepted", {
        senderId: "sender",
        connection: result.sentConnection,
      });
    });

    it("warms the presence cache for both parties", async () => {
      await service.acceptRequest("receiver", "c1");

      expect(presence.setPresenceLookup).toHaveBeenCalledWith("sender", "receiver");
    });

    it("does not fail when presence warming rejects (fire-and-forget)", async () => {
      presence.setPresenceLookup.mockRejectedValue(new Error("redis down"));

      await expect(service.acceptRequest("receiver", "c1")).resolves.toMatchObject({
        sentConnection: { status: "ACCEPTED" },
      });
    });

    it("forbids accepting a request addressed to someone else", async () => {
      await expect(service.acceptRequest("intruder", "c1")).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(transaction.run).not.toHaveBeenCalled();
    });

    it("reports a missing connection as not found", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.acceptRequest("receiver", "gone")).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("declineRequest / cancelRequest", () => {
    it("declineRequest deletes the request and its notification, then announces to the sender", async () => {
      repo.findById.mockResolvedValue(buildConnection());

      await expect(service.declineRequest("receiver", "c1")).resolves.toBe("c1");

      expect(repo.delete).toHaveBeenCalledWith("c1", {});
      expect(notifications.deleteByReference).toHaveBeenCalledWith(
        { referenceId: "c1", userId: "receiver", type: "CONNECTION_REQUEST" },
        {},
      );
      expect(dispatcher.emit).toHaveBeenCalledWith("request:declined", {
        senderId: "sender",
        receiverId: "receiver",
        connectionId: "c1",
      });
    });

    it("cancelRequest withdraws the alert from the recipient's inbox", async () => {
      repo.findById.mockResolvedValue(buildConnection());

      await expect(service.cancelRequest("sender", "c1")).resolves.toBe("c1");

      expect(notifications.deleteByReference).toHaveBeenCalledWith(
        { referenceId: "c1", userId: "receiver", type: "CONNECTION_REQUEST" },
        {},
      );
      expect(dispatcher.emit).toHaveBeenCalledWith("request:canceled", {
        receiverId: "receiver",
        senderId: "sender",
        connectionId: "c1",
      });
    });

    it("refuses to decline a request that is no longer pending", async () => {
      repo.findById.mockResolvedValue(buildConnection({ status: "ACCEPTED" }));

      await expect(service.declineRequest("receiver", "c1")).rejects.toMatchObject({ code: "CONFLICT" });
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe("removeContact", () => {
    beforeEach(() => {
      repo.findBetween.mockResolvedValue(buildConnection({ status: "ACCEPTED" }));
    });

    it("looks the pair up by user id, deletes the row, and clears both inboxes", async () => {
      await expect(service.removeContact("sender", "receiver")).resolves.toBe("c1");

      expect(repo.findBetween).toHaveBeenCalledWith("sender", "receiver");
      expect(repo.delete).toHaveBeenCalledWith("c1", {});
      expect(notifications.deleteByReference).toHaveBeenCalledWith(
        { referenceId: "c1", userId: "sender", type: "CONNECTION_ACCEPTED" },
        {},
      );
      expect(notifications.deleteByReference).toHaveBeenCalledWith(
        { referenceId: "c1", userId: "receiver", type: "CONNECTION_ACCEPTED" },
        {},
      );
    });

    it("tears the pair out of the presence graph and announces to the other party", async () => {
      await service.removeContact("sender", "receiver");

      expect(presence.removePresenceLookup).toHaveBeenCalledWith("sender", "receiver");
      expect(dispatcher.emit).toHaveBeenCalledWith("contact:removed", {
        authUserId: "sender",
        contactUserId: "receiver",
        connectionId: "c1",
      });
    });

    it("works from the receiving side too — either party may remove", async () => {
      await expect(service.removeContact("receiver", "sender")).resolves.toBe("c1");
      expect(repo.delete).toHaveBeenCalledWith("c1", {});
    });

    it("reports a stranger as not found without opening a transaction", async () => {
      repo.findBetween.mockResolvedValue(null);

      await expect(service.removeContact("sender", "receiver")).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(transaction.run).not.toHaveBeenCalled();
    });

    it("refuses to remove a still-pending request as a conflict", async () => {
      repo.findBetween.mockResolvedValue(buildConnection({ status: "PENDING" }));

      await expect(service.removeContact("sender", "receiver")).rejects.toMatchObject({ code: "CONFLICT" });
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("commits the removal even when the presence teardown fails", async () => {
      presence.removePresenceLookup.mockRejectedValue(new Error("redis down"));

      await expect(service.removeContact("sender", "receiver")).resolves.toBe("c1");
      expect(repo.delete).toHaveBeenCalled();
    });
  });
});
