import { buildKeysetPage, keysetFilter, keysetTake } from "@/shared/persistence/keyset-pagination";
import { decodeCursor, encodeCursor } from "@/utils/cursor";

interface Row {
  id: string;
  updatedAt: Date;
}

function buildRows(count: number, sharedTimestamp = false): Row[] {
  const base = new Date("2026-07-05T00:00:00.000Z").getTime();
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${String(i).padStart(3, "0")}`,
    updatedAt: new Date(sharedTimestamp ? base : base - i * 60_000),
  }));
}

describe("keysetFilter", () => {
  it("contributes nothing on the first page, so it can always be spread into AND", () => {
    expect(keysetFilter("updatedAt", undefined)).toEqual([]);
    expect(keysetFilter("updatedAt", "")).toEqual([]);
  });

  it("ignores a malformed cursor rather than producing a predicate that matches nothing", () => {
    expect(keysetFilter("updatedAt", "not-a-real-cursor")).toEqual([]);
  });

  it("seeks strictly before the boundary, including the id tiebreaker", () => {
    const timestamp = new Date("2026-07-05T00:00:00.000Z");
    const [clause] = keysetFilter<{ OR: Record<string, unknown>[] }>("updatedAt", encodeCursor(timestamp, "row-010"));

    expect(clause?.OR).toEqual([
      { updatedAt: { lt: timestamp } },
      // Rows sharing the boundary timestamp are still walked, by id — without
      // this they would be skipped entirely.
      { updatedAt: timestamp, id: { lt: "row-010" } },
    ]);
  });

  it("seeks on whichever timestamp column the list is ordered by", () => {
    const timestamp = new Date("2026-07-05T00:00:00.000Z");
    const [clause] = keysetFilter<{ OR: Record<string, unknown>[] }>("createdAt", encodeCursor(timestamp, "row-001"));

    expect(clause?.OR?.[0]).toEqual({ createdAt: { lt: timestamp } });
  });
});

describe("keysetTake", () => {
  it("probes one row beyond the page so hasMore is known without a second query", () => {
    expect(keysetTake(20)).toBe(21);
  });
});

describe("buildKeysetPage", () => {
  const page = (rows: Row[], limit: number) =>
    buildKeysetPage({
      rows,
      limit,
      timestampOf: (row) => row.updatedAt,
      idOf: (row) => row.id,
      map: (row) => row.id,
    });

  it("trims the probe row off and advertises a next page", () => {
    const result = page(buildRows(11), 10);

    expect(result.items).toHaveLength(10);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).not.toBeNull();
  });

  it("does not over-report hasMore when the page is exactly full", () => {
    // 10 rows with limit 10 means the probe found nothing extra — there is no
    // phantom next page.
    const result = page(buildRows(10), 10);

    expect(result.items).toHaveLength(10);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("reports no next page for a partial final page", () => {
    const result = page(buildRows(3), 10);

    expect(result.items).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("mints the cursor from the last row of the page, not the probe row", () => {
    const rows = buildRows(11);
    const result = page(rows, 10);

    const decoded = decodeCursor(result.nextCursor);
    expect(decoded?.id).toBe(rows[9]?.id);
    expect(decoded?.timestamp).toEqual(rows[9]?.updatedAt);
  });

  it("still produces an advancing cursor when every row shares a timestamp", () => {
    const rows = buildRows(11, true);
    const result = page(rows, 10);

    // The id tiebreaker is what keeps the seek moving here.
    expect(decodeCursor(result.nextCursor)?.id).toBe(rows[9]?.id);
  });

  it("returns an empty page rather than a cursor when there are no rows", () => {
    const result = page([], 10);

    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("applies the row mapper to the page only", () => {
    const rows = buildRows(11);
    const result = page(rows, 10);

    expect(result.items).toEqual(rows.slice(0, 10).map((row) => row.id));
  });
});
