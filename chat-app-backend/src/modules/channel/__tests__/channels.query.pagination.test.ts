import { ChannelsQuery } from "@/modules/channel/persistence/channels.query";

// The generated Prisma client connects/loads heavy code on import; it is never
// used here — a faithful in-memory findMany is injected instead.
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

interface Row {
  id: string;
  type: "GROUP" | "DIRECT";
  name: string;
  updatedAt: Date;
  channelMembers: { userId: string }[];
}

// ---------------------------------------------------------------------------
// A faithful evaluator for the channels `where` shape: nested AND/OR groups,
// relation `some` filters, `contains`, `not`, and the keyset predicate
//   OR: [ { updatedAt: { lt } }, { updatedAt, id: { lt } } ]
// It re-implements only the operators the repository relies on, so the test
// pins the real seek + filter semantics rather than a hand-rolled query.
// ---------------------------------------------------------------------------
function matchesValue(value: unknown, condition: unknown): boolean {
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
    if ("not" in obj) return !matchesValue(value, obj.not);
    if ("some" in obj) {
      return (
        Array.isArray(value) &&
        value.some((el) => matchesWhere(el as Record<string, unknown>, obj.some as Record<string, unknown>))
      );
    }
    // Nested relation object, e.g. user: { name: { contains } }.
    return matchesWhere((value ?? {}) as Record<string, unknown>, obj);
  }
  return value === condition;
}

function matchesWhere(entity: Record<string, unknown>, where: Record<string, unknown>): boolean {
  for (const [key, condition] of Object.entries(where)) {
    if (key === "OR") {
      const clauses = condition as Record<string, unknown>[];
      if (!clauses.some((clause) => matchesWhere(entity, clause))) return false;
      continue;
    }
    if (key === "AND") {
      const clauses = condition as Record<string, unknown>[];
      if (!clauses.every((clause) => matchesWhere(entity, clause))) return false;
      continue;
    }
    if (!matchesValue(entity[key], condition)) return false;
  }
  return true;
}

function makeDb(rows: Row[]) {
  return {
    channel: {
      findMany: jest.fn(
        async (args: { where: Record<string, unknown>; take: number; orderBy: Record<string, unknown>[] }) => {
          const filtered = rows.filter((row) => matchesWhere(row as unknown as Record<string, unknown>, args.where));
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
        return rows.filter((row) => matchesWhere(row as unknown as Record<string, unknown>, args.where)).length;
      }),
    },
  };
}

function buildRows(count: number, sharedTimestampGroups: number): Row[] {
  const rows: Row[] = [];
  const base = new Date("2026-07-05T00:00:00.000Z").getTime();
  const groupSize = Math.ceil(count / sharedTimestampGroups);

  for (let i = 0; i < count; i++) {
    // Rows within a group share an identical updatedAt — the collision case a
    // timestamp-only cursor would skip over.
    const group = Math.floor(i / groupSize);
    rows.push({
      id: `chan-${String(i).padStart(3, "0")}`,
      type: "GROUP",
      name: `Channel ${i}`,
      updatedAt: new Date(base + group * 60_000),
      channelMembers: [{ userId: "me" }, { userId: `other-${i}` }],
    });
  }
  return rows;
}

describe("ChannelsQuery keyset pagination (no skips / no duplicates)", () => {
  async function paginateAll(rows: Row[], limit: number, query?: string) {
    const db = makeDb(rows);
    const repo = new ChannelsQuery(db as never);

    const seenIds: string[] = [];
    const seenOrder: Date[] = [];
    let cursor: string | undefined = undefined;
    let pages = 0;
    const maxPages = Math.ceil(rows.length / limit) + 5;

    for (;;) {
      const page = await repo.getChannels({
        authUserId: "me",
        limit,
        ...(query !== undefined && { query }),
        ...(cursor !== undefined && { cursor }),
      });
      pages++;
      for (const channel of page.channels) {
        seenIds.push(channel.id);
        seenOrder.push(channel.updatedAt);
      }
      if (!page.hasMore || !page.nextCursor) break;
      cursor = page.nextCursor;
      if (pages > maxPages) throw new Error("cursor failed to advance — possible infinite loop");
    }

    return { seenIds, seenOrder, pages };
  }

  it("walks every channel exactly once across pages, even with colliding timestamps", async () => {
    // 25 rows across 5 timestamp groups → 5 rows share each updatedAt.
    const rows = buildRows(25, 5);
    const { seenIds, pages } = await paginateAll(rows, 10);

    expect(seenIds).toHaveLength(rows.length);
    expect(new Set(seenIds).size).toBe(rows.length); // no duplicates
    expect(new Set(seenIds)).toEqual(new Set(rows.map((r) => r.id))); // no skips
    expect(pages).toBe(3); // 10 + 10 + 5
  });

  it("returns channels in strictly non-increasing updatedAt order", async () => {
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
    const repo = new ChannelsQuery(db as never);

    const first = await repo.getChannels({ authUserId: "me", limit: 20 });

    expect(first.channels).toHaveLength(15);
    expect(first.hasMore).toBe(false);
    expect(first.nextCursor).toBeNull();
  });

  it("applies the name search filter while paginating without skips", async () => {
    // Names "Channel 0".."Channel 24" — query "Channel 1" matches 1 and 10-19.
    const rows = buildRows(25, 5);
    const { seenIds } = await paginateAll(rows, 4, "Channel 1");

    const expected = rows.filter((r) => r.name.toLowerCase().includes("channel 1")).map((r) => r.id);
    expect(new Set(seenIds)).toEqual(new Set(expected));
    expect(seenIds).toHaveLength(expected.length); // no duplicates across pages
  });

  it("excludes channels the user is not a member of", async () => {
    const rows = buildRows(6, 2);
    // Strip the auth user from half the channels' membership.
    rows.slice(3).forEach((r) => (r.channelMembers = [{ userId: "someone-else" }]));

    const { seenIds } = await paginateAll(rows, 20);

    expect(seenIds).toHaveLength(3);
    expect(seenIds.every((id) => Number(id.split("-")[1]) < 3)).toBe(true);
  });
});
