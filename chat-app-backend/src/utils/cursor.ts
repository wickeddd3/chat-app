/**
 * Opaque keyset-pagination cursor.
 *
 * Encodes a primary timestamp (createdAt/updatedAt) plus the row id as a
 * tiebreaker. Ordering + seeking by a UUID id alone is meaningless, and ordering
 * by a timestamp alone skips rows that share the boundary timestamp — the
 * (timestamp, id) pair is unique and stable, so pages never skip or duplicate.
 *
 * The token is opaque to clients: they only echo `nextCursor` back as `cursor`.
 */
export interface DecodedCursor {
  timestamp: Date;
  id: string;
}

export function encodeCursor(timestamp: Date, id: string): string {
  return Buffer.from(`${timestamp.toISOString()}|${id}`).toString("base64url");
}

export function decodeCursor(raw: string | undefined | null): DecodedCursor | null {
  if (!raw) return null;
  try {
    const [iso, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
    if (!iso || !id) return null;
    const timestamp = new Date(iso);
    if (Number.isNaN(timestamp.getTime())) return null;
    return { timestamp, id };
  } catch {
    return null;
  }
}
