import { decodeCursor, encodeCursor } from "@/utils/cursor";

/**
 * Keyset pagination mechanics, factored out of the individual repositories.
 *
 * Every paginated list here seeks on a `(timestamp, id)` pair ordered descending
 * and probes for the next page with `take: limit + 1`. That logic was previously
 * re-spelled at each query site; the two halves live here instead:
 *
 *   - {@link keysetFilter} — the `where` predicate for "strictly before the cursor"
 *   - {@link buildKeysetPage} — the `hasMore` / trim / `nextCursor` tail
 *
 * The Prisma query itself stays at the call site, so `select`/`include` inference
 * is untouched.
 */

/** The timestamp column a list seeks on. */
export type CursorField = "createdAt" | "updatedAt";

export interface KeysetPage<T> {
  items: T[];
  hasMore: boolean;
  /** Opaque token for the next (older) page; `null` on the last page. */
  nextCursor: string | null;
}

/**
 * Builds the "strictly before the cursor" predicate as an array to be spread
 * into a query's `AND`.
 *
 * Returned as an array (rather than an optional object) so callers can always
 * write `AND: [...baseAnd, ...keysetFilter(...)]` — the first page contributes
 * nothing instead of needing a conditional spread.
 *
 * Generic over the caller's `WhereInput` so the shape lands in the query fully
 * typed; the single cast is confined here.
 */
export function keysetFilter<TWhere>(field: CursorField, cursor?: string | null): TWhere[] {
  const decoded = decodeCursor(cursor);
  if (!decoded) return [];

  return [
    {
      OR: [
        // Older than the boundary timestamp...
        { [field]: { lt: decoded.timestamp } },
        // ...or sharing it, but earlier in the id tiebreaker. Without this,
        // rows that collide on the timestamp would be skipped.
        { [field]: decoded.timestamp, id: { lt: decoded.id } },
      ],
    } as TWhere,
  ];
}

/** Always fetch one extra row beyond the page to detect a next page reliably. */
export function keysetTake(limit: number): number {
  return limit + 1;
}

/**
 * Trims the `limit + 1` probe row off, reports whether more remain, and mints the
 * cursor from the last row of the page.
 *
 * `rows` must be in query order (descending); `timestampOf` reads the same column
 * passed to {@link keysetFilter}.
 */
export function buildKeysetPage<TRow, TOut>({
  rows,
  limit,
  timestampOf,
  idOf,
  map,
}: {
  rows: TRow[];
  limit: number;
  timestampOf: (row: TRow) => Date;
  idOf: (row: TRow) => string;
  map: (row: TRow) => TOut;
}): KeysetPage<TOut> {
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  // The last row of this descending page is the boundary for the next one.
  const lastRow = pageRows.at(-1);
  const nextCursor = hasMore && lastRow ? encodeCursor(timestampOf(lastRow), idOf(lastRow)) : null;

  return {
    items: pageRows.map(map),
    hasMore,
    nextCursor,
  };
}
