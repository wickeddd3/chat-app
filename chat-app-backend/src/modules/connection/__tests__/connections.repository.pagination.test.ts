import { ConnectionsRepository } from "@/modules/connection/connections.repository";
import type { PaginatedConnections } from "@/modules/connection/connections.types";

// The generated Prisma client connects/loads heavy code on import; it is never
// used here — a faithful in-memory findMany is injected instead.
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

interface Row {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  receiver: { id: string; name: string; username: string; image: string | null };
  sender: { id: string; name: string; username: string; image: string | null };
}

// ---------------------------------------------------------------------------
// A minimal, faithful evaluator for the `where` shapes the repository builds:
// equality filters, nested relation filters (`receiver: { name: { contains } }`),
// AND/OR groups, and the keyset predicate of the form
//   OR: [ { updatedAt: { lt } }, { updatedAt, id: { lt } } ]
// It re-implements only the operators the repo relies on, so the test pins the
// real seek semantics rather than a hand-rolled query string.
// ---------------------------------------------------------------------------
function matchesCondition(value: unknown, condition: unknown): boolean {
  if (condition instanceof Date) {
    return value instanceof Date && value.getTime() === condition.getTime();
  }
  if (condition !== null && typeof condition === "object") {
    const obj = condition as Record<string, unknown>;
    if ("lt" in obj) {
      const bound = obj.lt;
      if (bound instanceof Date) return value instanceof Date && value.getTime() < bound.getTime();
      return String(value) < String(bound);
    }
    if ("contains" in obj) {
      return String(value ?? "")
        .toLowerCase()
        .includes(String(obj.contains).toLowerCase());
    }
    // Nested relation object — every sub-field must match.
    return Object.entries(obj).every(([k, sub]) => matchesCondition((value as Record<string, unknown>)?.[k], sub));
  }
  return value === condition;
}

function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, condition] of Object.entries(where)) {
    if (key === "OR") {
      const clauses = condition as Record<string, unknown>[];
      if (!clauses.some((clause) => matchesWhere(row, clause))) return false;
      continue;
    }
    if (key === "AND") {
      const clauses = condition as Record<string, unknown>[];
      if (!clauses.every((clause) => matchesWhere(row, clause))) return false;
      continue;
    }
    if (!matchesCondition((row as unknown as Record<string, unknown>)[key], condition)) return false;
  }
  return true;
}

function makeDb(rows: Row[]) {
  return {
    connection: {
      findMany: jest.fn(
        async (args: {
          where: Record<string, unknown>;
          take: number;
          orderBy: { updatedAt?: "desc"; id?: "desc" }[];
        }) => {
          const filtered = rows.filter((row) => matchesWhere(row, args.where));
          // orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
          filtered.sort((a, b) => {
            const byTime = b.updatedAt.getTime() - a.updatedAt.getTime();
            if (byTime !== 0) return byTime;
            return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
          });
          return filtered.slice(0, args.take);
        },
      ),
      count: jest.fn(async (args: { where: Record<string, unknown> }) => {
        return rows.filter((row) => matchesWhere(row, args.where)).length;
      }),
    },
  };
}

function buildRows(count: number, sharedTimestampGroups: number): Row[] {
  const rows: Row[] = [];
  const base = new Date("2026-07-05T00:00:00.000Z").getTime();
  const groupSize = Math.ceil(count / sharedTimestampGroups);

  for (let i = 0; i < count; i++) {
    // Rows within the same group share an identical updatedAt — the collision
    // case a timestamp-only cursor would skip over.
    const group = Math.floor(i / groupSize);
    const updatedAt = new Date(base + group * 60_000);
    const id = `conn-${String(i).padStart(3, "0")}`;
    rows.push({
      id,
      senderId: "me",
      receiverId: `u-${i}`,
      status: "PENDING",
      createdAt: updatedAt,
      updatedAt,
      receiver: { id: `u-${i}`, name: `User ${i}`, username: `user${i}`, image: null },
      sender: { id: "me", name: "Me", username: "me", image: null },
    });
  }
  return rows;
}

describe("ConnectionsRepository keyset pagination (no skips / no duplicates)", () => {
  function paginateAll(rows: Row[], method: "getSentConnections" | "getReceivedConnections", limit: number) {
    const db = makeDb(rows);
    const repo = new ConnectionsRepository(db as never);

    return (async () => {
      const seenIds: string[] = [];
      const seenOrder: Date[] = [];
      let cursor: string | undefined = undefined;
      let pages = 0;

      // Hard cap prevents an infinite loop if the cursor ever fails to advance.
      const maxPages = Math.ceil(rows.length / limit) + 5;

      for (;;) {
        const page: PaginatedConnections = await repo[method]({
          authUserId: "me",
          limit,
          ...(cursor !== undefined && { cursor }),
        });
        pages++;
        for (const conn of page.connections) {
          if (conn.id === undefined || conn.updatedAt === undefined) {
            throw new Error("connection row missing id/updatedAt");
          }
          seenIds.push(conn.id);
          seenOrder.push(conn.updatedAt);
        }
        if (!page.hasMore || !page.nextCursor) break;
        cursor = page.nextCursor;
        if (pages > maxPages) throw new Error("cursor failed to advance — possible infinite loop");
      }

      return { seenIds, seenOrder, pages };
    })();
  }

  it("walks every row exactly once across pages, even with colliding timestamps", async () => {
    // 25 rows across 5 timestamp groups → 5 rows share each updatedAt.
    const rows = buildRows(25, 5);
    const { seenIds, pages } = await paginateAll(rows, "getSentConnections", 10);

    expect(seenIds).toHaveLength(rows.length);
    expect(new Set(seenIds).size).toBe(rows.length); // no duplicates
    expect(new Set(seenIds)).toEqual(new Set(rows.map((r) => r.id))); // no skips
    expect(pages).toBe(3); // 10 + 10 + 5
  });

  it("returns rows in strictly non-increasing updatedAt order", async () => {
    const rows = buildRows(25, 5);
    const { seenOrder } = await paginateAll(rows, "getSentConnections", 10);

    for (let i = 1; i < seenOrder.length; i++) {
      const current = seenOrder[i];
      const previous = seenOrder[i - 1];
      if (!current || !previous) throw new Error("unexpected sparse order array");
      expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
    }
  });

  it("reports hasMore=false and a null cursor on the final page", async () => {
    const rows = buildRows(15, 3);
    const db = makeDb(rows);
    const repo = new ConnectionsRepository(db as never);

    const first = await repo.getSentConnections({ authUserId: "me", limit: 20 });

    // A single page holds everything → no next page advertised.
    expect(first.connections).toHaveLength(15);
    expect(first.hasMore).toBe(false);
    expect(first.nextCursor).toBeNull();
  });

  it("does not over-report hasMore when the total is an exact multiple of the limit", async () => {
    // 20 rows, limit 10 → exactly 2 full pages; the take:limit+1 probe must not
    // advertise a phantom third page.
    const rows = buildRows(20, 4);
    const { seenIds, pages } = await paginateAll(rows, "getSentConnections", 10);

    expect(seenIds).toHaveLength(20);
    expect(new Set(seenIds).size).toBe(20);
    expect(pages).toBe(2);
  });

  it("paginates received connections with the same guarantees", async () => {
    const rows = buildRows(25, 5).map((r) => ({ ...r, receiverId: "me", senderId: `u-${r.id}` }));
    const { seenIds, pages } = await paginateAll(rows, "getReceivedConnections", 10);

    expect(seenIds).toHaveLength(25);
    expect(new Set(seenIds).size).toBe(25);
    expect(pages).toBe(3);
  });

  // getUserContacts returns the opposing User profile (not the connection), so
  // it needs its own walk; the no-skip guarantee is asserted on the contact id.
  async function paginateContacts(rows: Row[], limit: number) {
    const db = makeDb(rows);
    const repo = new ConnectionsRepository(db as never);

    const seenIds: string[] = [];
    let cursor: string | undefined = undefined;
    let pages = 0;
    const maxPages = Math.ceil(rows.length / limit) + 5;

    for (;;) {
      const page = await repo.getUserContacts({ authUserId: "me", limit, ...(cursor !== undefined && { cursor }) });
      pages++;
      for (const contact of page.contacts) {
        if (contact.id === undefined) throw new Error("contact missing id");
        seenIds.push(contact.id);
      }
      if (!page.hasMore || !page.nextCursor) break;
      cursor = page.nextCursor;
      if (pages > maxPages) throw new Error("cursor failed to advance — possible infinite loop");
    }

    return { seenIds, pages };
  }

  it("paginates accepted contacts with no skips across colliding timestamps", async () => {
    // Contacts only surfaces ACCEPTED connections; each row's opposing user is
    // unique (u-0..u-24). 5 rows share each updatedAt.
    const rows = buildRows(25, 5).map((r) => ({ ...r, status: "ACCEPTED" }));
    const { seenIds, pages } = await paginateContacts(rows, 10);

    expect(seenIds).toHaveLength(25);
    expect(new Set(seenIds).size).toBe(25);
    expect(new Set(seenIds)).toEqual(new Set(rows.map((r) => r.receiver.id)));
    expect(pages).toBe(3);
  });

  it("excludes non-accepted connections from contacts", async () => {
    const rows = buildRows(10, 2).map((r, i) => ({ ...r, status: i < 4 ? "ACCEPTED" : "PENDING" }));
    const { seenIds } = await paginateContacts(rows, 20);

    expect(seenIds).toHaveLength(4);
  });
});
