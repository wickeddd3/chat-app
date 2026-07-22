import { assertIsChannelAdmin } from "@/modules/channel/channels.policy";
import { directMemberRows, groupMemberRows } from "@/modules/channel/channels.members";

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
