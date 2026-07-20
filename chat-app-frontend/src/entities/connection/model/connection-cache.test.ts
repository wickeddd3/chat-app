import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import {
  prependConnectionRequest,
  prependContact,
  removeConnectionRequest,
} from "./connection-cache";
import type {
  Connection,
  ConnectionUser,
  PaginatedConnections,
  PaginatedContacts,
} from "./connection.types";

const keys = createQueryKeys("auth-user");

function connection(id: string): Connection {
  return {
    id,
    status: "PENDING",
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T00:00:00.000Z",
    user: { id: `user-${id}`, name: `User ${id}`, username: `user${id}` },
  };
}

function contact(id: string): ConnectionUser {
  return { id, name: `User ${id}`, username: `user${id}` };
}

function connectionsData(
  pages: { connections: Connection[]; total: number }[],
): InfiniteData<PaginatedConnections> {
  return {
    pages: pages.map(({ connections, total }) => ({
      connections,
      total,
      hasMore: false,
      nextCursor: null,
    })),
    pageParams: pages.map(() => null),
  };
}

function contactsData(
  contacts: ConnectionUser[],
  total: number,
): InfiniteData<PaginatedContacts> {
  return {
    pages: [{ contacts, total, hasMore: false, nextCursor: null }],
    pageParams: [null],
  };
}

describe("removeConnectionRequest", () => {
  it("drops the request and decrements the total on every page", () => {
    const qc = new QueryClient();
    const key = keys.connections.received();
    qc.setQueryData(
      key,
      connectionsData([
        { connections: [connection("a"), connection("b")], total: 5 },
        { connections: [connection("c")], total: 5 },
      ]),
    );

    removeConnectionRequest(qc, key, "a");

    const data = qc.getQueryData<InfiniteData<PaginatedConnections>>(key)!;
    expect(data.pages[0].connections.map((c) => c.id)).toEqual(["b"]);
    expect(data.pages.map((p) => p.total)).toEqual([4, 4]);
  });

  it("leaves the total alone when the request isn't cached", () => {
    const qc = new QueryClient();
    const key = keys.connections.received();
    qc.setQueryData(
      key,
      connectionsData([{ connections: [connection("a")], total: 1 }]),
    );

    removeConnectionRequest(qc, key, "missing");

    const data = qc.getQueryData<InfiniteData<PaginatedConnections>>(key)!;
    expect(data.pages[0].total).toBe(1);
  });

  it("never drives the total below zero", () => {
    const qc = new QueryClient();
    const key = keys.connections.sent();
    qc.setQueryData(
      key,
      connectionsData([{ connections: [connection("a")], total: 0 }]),
    );

    removeConnectionRequest(qc, key, "a");

    expect(
      qc.getQueryData<InfiniteData<PaginatedConnections>>(key)!.pages[0].total,
    ).toBe(0);
  });
});

describe("prependConnectionRequest", () => {
  it("prepends to the first page and increments the total", () => {
    const qc = new QueryClient();
    const key = keys.connections.sent();
    qc.setQueryData(
      key,
      connectionsData([
        { connections: [connection("a")], total: 3 },
        { connections: [connection("b")], total: 3 },
      ]),
    );

    prependConnectionRequest(qc, key, connection("new"));

    const data = qc.getQueryData<InfiniteData<PaginatedConnections>>(key)!;
    expect(data.pages[0].connections.map((c) => c.id)).toEqual(["new", "a"]);
    expect(data.pages.map((p) => p.total)).toEqual([4, 4]);
  });

  it("is a no-op when the request is already cached", () => {
    const qc = new QueryClient();
    const key = keys.connections.sent();
    qc.setQueryData(
      key,
      connectionsData([{ connections: [connection("a")], total: 1 }]),
    );

    prependConnectionRequest(qc, key, connection("a"));

    const data = qc.getQueryData<InfiniteData<PaginatedConnections>>(key)!;
    expect(data.pages[0].connections).toHaveLength(1);
    expect(data.pages[0].total).toBe(1);
  });
});

describe("prependContact", () => {
  it("prepends the contact and increments the total", () => {
    const qc = new QueryClient();
    const key = keys.connections.contacts("");
    qc.setQueryData(key, contactsData([contact("a")], 7));

    prependContact(qc, key, contact("new"));

    const data = qc.getQueryData<InfiniteData<PaginatedContacts>>(key)!;
    expect(data.pages[0].contacts.map((c) => c.id)).toEqual(["new", "a"]);
    expect(data.pages[0].total).toBe(8);
  });

  it("is a no-op when the contact is already cached", () => {
    const qc = new QueryClient();
    const key = keys.connections.contacts("");
    qc.setQueryData(key, contactsData([contact("a")], 7));

    prependContact(qc, key, contact("a"));

    const data = qc.getQueryData<InfiniteData<PaginatedContacts>>(key)!;
    expect(data.pages[0].contacts).toHaveLength(1);
    expect(data.pages[0].total).toBe(7);
  });
});
