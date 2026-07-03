import { render, screen } from "@testing-library/react";
import { ChannelHeader } from "./ChannelHeader";
import type { InboxChannel } from "../model/channel.types";

function channel(overrides: Partial<InboxChannel> = {}): InboxChannel {
  return {
    id: "chan-1",
    name: "Weekend Trip",
    type: "GROUP",
    displayName: "Weekend Trip",
    displayImage: "",
    channelMembers: [],
    lastMessage: { content: "", createdAt: "2026-01-01T00:00:00.000Z" },
    messages: [],
    recipient: null,
    ...overrides,
  };
}

describe("ChannelHeader", () => {
  it("renders nothing when there is no channel", () => {
    const { container } = render(<ChannelHeader channel={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the channel display name", () => {
    render(<ChannelHeader channel={channel()} />);

    expect(
      screen.getByRole("heading", { name: "Weekend Trip" }),
    ).toBeInTheDocument();
  });

  it("renders the option slot content", () => {
    render(
      <ChannelHeader
        channel={channel()}
        optionSlot={<button type="button">Details</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Details" }),
    ).toBeInTheDocument();
  });
});
