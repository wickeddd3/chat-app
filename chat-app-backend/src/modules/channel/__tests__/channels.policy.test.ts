import { assertCanLeaveGroup, assertIsChannelAdmin } from "@/modules/channel/channels.policy";
import { directMemberRows, groupMemberRows, nextAdminId } from "@/modules/channel/channels.members";

describe("channels policy", () => {
  it("allows an admin through", () => {
    expect(() => assertIsChannelAdmin(true)).not.toThrow();
  });

  it("forbids a non-admin", () => {
    expect(() => assertIsChannelAdmin(false)).toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });
});

describe("membership composition", () => {
  it("directMemberRows lists both participants as plain members", () => {
    expect(directMemberRows("c1", "u1", "u2")).toEqual([
      { channelId: "c1", userId: "u1", role: "MEMBER" },
      { channelId: "c1", userId: "u2", role: "MEMBER" },
    ]);
  });

  it("groupMemberRows makes the creator ADMIN and the rest MEMBER", () => {
    expect(groupMemberRows("c1", "admin", ["u2", "u3"])).toEqual([
      { channelId: "c1", userId: "admin", role: "ADMIN" },
      { channelId: "c1", userId: "u2", role: "MEMBER" },
      { channelId: "c1", userId: "u3", role: "MEMBER" },
    ]);
  });

  it("groupMemberRows never lists the creator twice when they are also in memberIds", () => {
    const rows = groupMemberRows("c1", "admin", ["admin", "u2"]);

    expect(rows.filter((r) => r.userId === "admin")).toEqual([{ channelId: "c1", userId: "admin", role: "ADMIN" }]);
    expect(rows).toHaveLength(2);
  });
});

describe("assertCanLeaveGroup", () => {
  const group = { type: "GROUP" as const };

  it("lets a member leave a group", () => {
    expect(() => assertCanLeaveGroup(group, true)).not.toThrow();
  });

  it("refuses a non-member", () => {
    expect(() => assertCanLeaveGroup(group, true)).not.toThrow();
    expect(() => assertCanLeaveGroup(group, false)).toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("refuses a direct channel — that is dissolved by removing the contact", () => {
    expect(() => assertCanLeaveGroup({ type: "DIRECT" }, true)).toThrow(
      expect.objectContaining({ code: "VALIDATION" }),
    );
  });

  it("reports a missing channel as not found", () => {
    expect(() => assertCanLeaveGroup(null, true)).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});

describe("nextAdminId", () => {
  const at = (iso: string) => new Date(iso);

  const admin = { userId: "admin", role: "ADMIN" as const, joinedAt: at("2026-01-01T00:00:00Z") };
  const early = { userId: "early", role: "MEMBER" as const, joinedAt: at("2026-02-01T00:00:00Z") };
  const late = { userId: "late", role: "MEMBER" as const, joinedAt: at("2026-03-01T00:00:00Z") };

  it("promotes the longest-standing member when the last admin leaves", () => {
    expect(nextAdminId([admin, late, early], "admin")).toBe("early");
  });

  it("promotes nobody while another admin remains", () => {
    const coAdmin = { ...early, role: "ADMIN" as const };
    expect(nextAdminId([admin, coAdmin, late], "admin")).toBeNull();
  });

  it("promotes nobody when a plain member leaves", () => {
    expect(nextAdminId([admin, early, late], "late")).toBeNull();
  });

  it("promotes nobody when the last member leaves — there is no group left", () => {
    expect(nextAdminId([admin], "admin")).toBeNull();
  });

  it("breaks a joinedAt tie deterministically, so replays agree", () => {
    const sameTime = at("2026-02-01T00:00:00Z");
    const b = { userId: "b", role: "MEMBER" as const, joinedAt: sameTime };
    const a = { userId: "a", role: "MEMBER" as const, joinedAt: sameTime };

    expect(nextAdminId([admin, b, a], "admin")).toBe("a");
    expect(nextAdminId([admin, a, b], "admin")).toBe("a");
  });
});
