import { decodeCursor, encodeCursor } from "@/utils/cursor";

describe("cursor codec", () => {
  it("round-trips a (timestamp, id) pair through encode/decode", () => {
    const timestamp = new Date("2026-07-05T12:34:56.789Z");
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    const decoded = decodeCursor(encodeCursor(timestamp, id));

    expect(decoded).not.toBeNull();
    expect(decoded?.timestamp.toISOString()).toBe(timestamp.toISOString());
    expect(decoded?.id).toBe(id);
  });

  it("produces an opaque base64url token (no reserved URL characters)", () => {
    const token = encodeCursor(new Date("2026-07-05T00:00:00.000Z"), "some-id");

    // base64url uses only A-Z a-z 0-9 - _ (no +, /, or = padding).
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("distinguishes two rows that share the same timestamp by id", () => {
    const timestamp = new Date("2026-07-05T12:00:00.000Z");

    const a = encodeCursor(timestamp, "id-aaa");
    const b = encodeCursor(timestamp, "id-bbb");

    expect(a).not.toBe(b);
    expect(decodeCursor(a)?.id).toBe("id-aaa");
    expect(decodeCursor(b)?.id).toBe("id-bbb");
  });

  it("preserves millisecond precision on the timestamp", () => {
    const timestamp = new Date("2026-07-05T12:00:00.123Z");

    const decoded = decodeCursor(encodeCursor(timestamp, "x"));

    expect(decoded?.timestamp.getTime()).toBe(timestamp.getTime());
  });

  describe("decodeCursor rejects invalid input by returning null", () => {
    it.each([
      ["undefined", undefined],
      ["null", null],
      ["empty string", ""],
    ])("%s", (_label, raw) => {
      expect(decodeCursor(raw)).toBeNull();
    });

    it("a token missing the id segment", () => {
      const noId = Buffer.from("2026-07-05T12:00:00.000Z").toString("base64url");
      expect(decodeCursor(noId)).toBeNull();
    });

    it("a token missing the timestamp segment", () => {
      const noTimestamp = Buffer.from("|some-id").toString("base64url");
      expect(decodeCursor(noTimestamp)).toBeNull();
    });

    it("a token whose timestamp segment is not a valid date", () => {
      const badDate = Buffer.from("not-a-date|some-id").toString("base64url");
      expect(decodeCursor(badDate)).toBeNull();
    });

    it("arbitrary non-base64 garbage", () => {
      // Buffer.from is lenient, so this decodes to bytes that won't contain a
      // "|" separator — decode should still fail closed rather than throw.
      expect(decodeCursor("!!!not base64!!!")).toBeNull();
    });
  });
});
