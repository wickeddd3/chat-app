import { isChannelAdmin } from "./channel-permissions";
import type { ChannelMember, InboxChannel } from "./channel.types";

function member(userId: string, role: string): ChannelMember {
  return {
    id: `m-${userId}`,
    role,
    user: { id: userId, name: userId, image: null, username: userId },
  };
}

function channel(members: ChannelMember[]): Pick<InboxChannel, "channelMembers"> {
  return { channelMembers: members };
}

describe("isChannelAdmin", () => {
  const group = channel([member("u1", "ADMIN"), member("u2", "MEMBER")]);

  it("returns true for an ADMIN member", () => {
    expect(isChannelAdmin(group, "u1")).toBe(true);
  });

  it("returns false for a non-admin member", () => {
    expect(isChannelAdmin(group, "u2")).toBe(false);
  });

  it("returns false for a non-member", () => {
    expect(isChannelAdmin(group, "stranger")).toBe(false);
  });

  it("returns false when the user id is undefined", () => {
    expect(isChannelAdmin(group, undefined)).toBe(false);
  });
});
