import { render, screen } from "@testing-library/react";
import { ChannelMembers } from "./ChannelMembers";
import type { ChannelMember as ChannelMemberType } from "../model/channel.types";

function member(id: string): ChannelMemberType {
  return {
    id: Number(id),
    role: "MEMBER",
    user: { id: `user-${id}`, name: `User ${id}`, image: null, username: id },
  };
}

describe("ChannelMembers", () => {
  it("renders a row for every member", () => {
    render(
      <ChannelMembers
        members={[member("1"), member("2")]}
        isOnline={() => false}
      />,
    );

    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 2")).toBeInTheDocument();
  });

  it("resolves presence per member id and reflects online members", () => {
    const isOnline = vi.fn((id: string) => id === "user-2");

    render(
      <ChannelMembers members={[member("1"), member("2")]} isOnline={isOnline} />,
    );

    expect(isOnline).toHaveBeenCalledWith("user-1");
    expect(isOnline).toHaveBeenCalledWith("user-2");
    // Only the online member surfaces the Online label.
    expect(screen.getByText("Online")).toBeInTheDocument();
  });
});
