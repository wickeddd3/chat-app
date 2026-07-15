import { NotificationsRepository } from "@/modules/notification/notifications.repository";

// The generated Prisma client connects/loads heavy code on import; it is never
// used here — a faithful in-memory findMany is injected instead.
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

interface Row {
  id: string;
  userId: string;
  isRead: boolean;
  createdAt: Date;
}

// Faithful evaluator for the `where` shape the repository builds: equality
// filters (userId, isRead) plus the optional keyset OR-group of the form
//   OR: [ { createdAt: { lt } }, { createdAt, id: { lt } } ]
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
    if (!matchesCondition((row as unknown as Record<string, unknown>)[key], condition)) return false;
  }
  return true;
}

function makeDb(rows: Row[]) {
  return {
    notification: {
      findMany: jest.fn(async (args: { where: Record<string, unknown>; take: number }) => {
        const filtered = rows.filter((row) => matchesWhere(row, args.where));
        // orderBy: [{ createdAt: "desc" }, { id: "desc" }]
        filtered.sort((a, b) => {
          const byTime = b.createdAt.getTime() - a.createdAt.getTime();
          if (byTime !== 0) return byTime;
          return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
        });
        return filtered.slice(0, args.take);
      }),
      count: jest.fn(async (args: { where: Record<string, unknown> }) => {
        return rows.filter((row) => matchesWhere(row, args.where)).length;
      }),
    },
  };
}

function buildRows(count: number, sharedTimestampGroups: number, isRead = false): Row[] {
  const rows: Row[] = [];
  const base = new Date("2026-07-05T00:00:00.000Z").getTime();
  const groupSize = Math.ceil(count / sharedTimestampGroups);

  for (let i = 0; i < count; i++) {
    // Rows within a group share an identical createdAt — the collision case a
    // timestamp-only cursor (or a mis-advancing skip) would drop.
    const group = Math.floor(i / groupSize);
    rows.push({
      id: `notif-${String(i).padStart(3, "0")}`,
      userId: "me",
      isRead,
      createdAt: new Date(base + group * 60_000),
    });
  }
  return rows;
}

describe("NotificationsRepository keyset pagination (no skips / no duplicates)", () => {
  async function paginateAll(rows: Row[], limit: number, isRead?: boolean) {
    const db = makeDb(rows);
    const repo = new NotificationsRepository(db as never);

    const seenIds: string[] = [];
    const seenOrder: Date[] = [];
    let cursor: string | undefined = undefined;
    let pages = 0;
    const maxPages = Math.ceil(rows.length / limit) + 5;

    for (;;) {
      const page = await repo.getByUserId({
        userId: "me",
        limit,
        ...(isRead !== undefined && { isRead }),
        ...(cursor !== undefined && { cursor }),
      });
      pages++;
      for (const n of page.notifications) {
        if (n.id === undefined || n.createdAt === undefined) throw new Error("notification missing id/createdAt");
        seenIds.push(n.id);
        seenOrder.push(n.createdAt);
      }
      if (!page.hasMore || !page.nextCursor) break;
      cursor = page.nextCursor;
      if (pages > maxPages) throw new Error("cursor failed to advance — possible infinite loop");
    }

    return { seenIds, seenOrder, pages };
  }

  it("walks every notification exactly once across pages, even with colliding timestamps", async () => {
    // 25 rows across 5 timestamp groups → 5 rows share each createdAt. The old
    // pop()+skip:1 cursor dropped the boundary row between pages; keyset must not.
    const rows = buildRows(25, 5);
    const { seenIds, pages } = await paginateAll(rows, 10);

    expect(seenIds).toHaveLength(rows.length);
    expect(new Set(seenIds).size).toBe(rows.length); // no duplicates
    expect(new Set(seenIds)).toEqual(new Set(rows.map((r) => r.id))); // no skips
    expect(pages).toBe(3); // 10 + 10 + 5
  });

  it("returns notifications in strictly non-increasing createdAt order", async () => {
    const rows = buildRows(25, 5);
    const { seenOrder } = await paginateAll(rows, 10);

    for (let i = 1; i < seenOrder.length; i++) {
      const current = seenOrder[i];
      const previous = seenOrder[i - 1];
      if (!current || !previous) throw new Error("unexpected sparse order array");
      expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
    }
  });

  it("does not over-report hasMore when the total is an exact multiple of the limit", async () => {
    // 20 rows, limit 10 → exactly 2 full pages; the take:limit+1 probe must not
    // advertise a phantom third page.
    const rows = buildRows(20, 4);
    const { seenIds, pages } = await paginateAll(rows, 10);

    expect(seenIds).toHaveLength(20);
    expect(new Set(seenIds).size).toBe(20);
    expect(pages).toBe(2);
  });

  it("reports hasMore=false and a null cursor on a single full page", async () => {
    const rows = buildRows(15, 3);
    const db = makeDb(rows);
    const repo = new NotificationsRepository(db as never);

    const first = await repo.getByUserId({ userId: "me", limit: 20 });

    expect(first.notifications).toHaveLength(15);
    expect(first.hasMore).toBe(false);
    expect(first.nextCursor).toBeNull();
  });

  it("applies the isRead filter while paginating", async () => {
    // Interleave read/unread; only the unread ones should page through.
    const unread = buildRows(12, 3, false);
    const read = buildRows(8, 2, true).map((r) => ({ ...r, id: `read-${r.id}` }));
    const { seenIds } = await paginateAll([...unread, ...read], 5, false);

    expect(seenIds).toHaveLength(12);
    expect(seenIds.every((id) => !id.startsWith("read-"))).toBe(true);
  });
});
