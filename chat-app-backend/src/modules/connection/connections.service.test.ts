import { Container } from "inversify";
import { TYPES } from "@/config/types";
import { ConnectionsService } from "@/modules/connection/connections.service";
import type { ConnectionRequestResponse } from "@/modules/connection/connections.types";

// Prevent the real prisma/redis clients from being constructed when the
// repository / presence classes are imported transitively (redis connects on
// construction). The service's own deps are supplied as mocks below.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
// The repository injects PrismaClient (referenced by decorator metadata even
// though the real repo is never instantiated) — stub it so the heavy generated
// client isn't loaded.
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

// A response shape the service reads from (only the fields it touches matter).
function buildResponse(): ConnectionRequestResponse {
  return {
    notification: { id: "n1", userId: "sender" },
    receivedConnection: { id: "c1" },
    sentConnection: { id: "c1" },
  } as unknown as ConnectionRequestResponse;
}

describe("ConnectionsService (DI container + mocked repository)", () => {
  let repo: {
    getUserContacts: jest.Mock;
    sendRequest: jest.Mock;
    acceptRequest: jest.Mock;
  };
  let dispatcher: { emit: jest.Mock };
  let presence: { setPresenceLookup: jest.Mock };
  let service: ConnectionsService;

  beforeEach(() => {
    repo = { getUserContacts: jest.fn(), sendRequest: jest.fn(), acceptRequest: jest.fn() };
    dispatcher = { emit: jest.fn() };
    presence = { setPresenceLookup: jest.fn().mockResolvedValue(undefined) };

    // Build a throwaway container: real service, mocked collaborators.
    const container = new Container();
    container.bind(TYPES.ConnectionsRepository).toConstantValue(repo);
    container.bind(TYPES.EventDispatcher).toConstantValue(dispatcher);
    container.bind(TYPES.PresenceService).toConstantValue(presence);
    container.bind<ConnectionsService>(TYPES.ConnectionsService).to(ConnectionsService);

    service = container.get<ConnectionsService>(TYPES.ConnectionsService);
  });

  it("passes defaults through to the repository and returns its result", async () => {
    const payload = { contacts: [{ id: "u2" }], hasMore: false, nextCursor: null };
    repo.getUserContacts.mockResolvedValue(payload);

    const result = await service.getUserContacts({ authUserId: "u1" });

    expect(result).toBe(payload);
    expect(repo.getUserContacts).toHaveBeenCalledWith({ authUserId: "u1", limit: 20, cursor: "", query: "" });
  });

  it("wraps a repository failure in a 500 HttpException, preserving the cause", async () => {
    const underlying = new Error("connection pool exhausted");
    repo.getUserContacts.mockRejectedValue(underlying);

    await expect(service.getUserContacts({ authUserId: "u1" })).rejects.toMatchObject({
      statusCode: 500,
      message: "Failed to retrieve connection contacts.",
      cause: underlying,
    });
  });

  it("sendRequest persists then emits notification:new and request:new", async () => {
    const response = buildResponse();
    repo.sendRequest.mockResolvedValue(response);

    await service.sendRequest("sender", "receiver");

    expect(repo.sendRequest).toHaveBeenCalledWith("sender", "receiver");
    expect(dispatcher.emit).toHaveBeenCalledWith("notification:new", response.notification);
    expect(dispatcher.emit).toHaveBeenCalledWith("request:new", {
      receiverId: "receiver",
      connection: response.receivedConnection,
    });
  });

  it("acceptRequest warms the presence cache and emits request:accepted", async () => {
    const response = buildResponse();
    repo.acceptRequest.mockResolvedValue(response);

    await service.acceptRequest("receiver", "conn1");

    expect(presence.setPresenceLookup).toHaveBeenCalledWith("sender", "receiver");
    expect(dispatcher.emit).toHaveBeenCalledWith("request:accepted", {
      senderId: "sender",
      connection: response.sentConnection,
    });
  });

  it("does not fail acceptRequest when presence warming rejects (fire-and-forget)", async () => {
    const response = buildResponse();
    repo.acceptRequest.mockResolvedValue(response);
    presence.setPresenceLookup.mockRejectedValue(new Error("redis down"));

    await expect(service.acceptRequest("receiver", "conn1")).resolves.toBe(response);
  });
});
