import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChannelDetails } from "./ChannelDetails";
import type { ChannelMember, InboxChannel } from "../model/channel.types";

function member(id: string): ChannelMember {
  return {
    id: Number(id),
    role: "MEMBER",
    user: { id: `user-${id}`, name: `User ${id}`, image: null, username: id },
  };
}

function channel(overrides: Partial<InboxChannel> = {}): InboxChannel {
  return {
    id: "chan-1",
    name: "Weekend Trip",
    type: "GROUP",
    displayName: "Weekend Trip",
    displayImage: "",
    channelMembers: [member("1"), member("2")],
    lastMessage: { content: "", createdAt: "2026-01-01T00:00:00.000Z" },
    messages: [],
    recipient: null,
    ...overrides,
  };
}

describe("ChannelDetails", () => {
  it("renders nothing when there is no channel", () => {
    const { container } = render(
      <ChannelDetails channel={null} isOnline={() => false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the channel name and its members by default", () => {
    render(<ChannelDetails channel={channel()} isOnline={() => false} />);

    expect(
      screen.getByRole("heading", { name: "Weekend Trip" }),
    ).toBeInTheDocument();
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 2")).toBeInTheDocument();
  });

  it("reveals the attachments placeholder when its section is opened", async () => {
    const user = userEvent.setup();
    render(<ChannelDetails channel={channel()} isOnline={() => false} />);

    // Attachments accordion starts collapsed.
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Attachments" }));

    expect(await screen.findByText("Coming soon")).toBeInTheDocument();
  });
});
