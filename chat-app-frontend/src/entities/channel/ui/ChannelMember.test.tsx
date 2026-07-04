import { render, screen } from "@testing-library/react";
import { ChannelMember } from "./ChannelMember";
import type { ChannelMember as ChannelMemberType } from "../model/channel.types";

function member(id: string): ChannelMemberType {
  return {
    id,
    role: "MEMBER",
    user: { id: `user-${id}`, name: `User ${id}`, image: null, username: id },
  };
}

describe("ChannelMember", () => {
  it("renders the member name", () => {
    render(<ChannelMember member={member("1")} />);

    expect(screen.getByText("User 1")).toBeInTheDocument();
  });

  it("shows the Online label when the member is online", () => {
    render(<ChannelMember member={member("1")} online />);

    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("hides the Online label when the member is offline", () => {
    render(<ChannelMember member={member("1")} online={false} />);

    expect(screen.queryByText("Online")).not.toBeInTheDocument();
  });
});
