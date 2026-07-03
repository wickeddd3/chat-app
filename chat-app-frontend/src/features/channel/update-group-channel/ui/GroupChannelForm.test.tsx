import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupChannelForm } from "./GroupChannelForm";
import { useUpdateGroupChannel } from "../model/useUpdateGroupChannel";
import type { ChannelMember, InboxChannel } from "@/entities/channel";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

// Keep the real zod schema; only stub the heavy member picker.
vi.mock("@/entities/connection", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/connection")>();
  return {
    ...actual,
    MemberListField: ({ label }: { label: string }) => <div>{label}</div>,
  };
});

vi.mock("../model/useUpdateGroupChannel", () => ({
  useUpdateGroupChannel: vi.fn(),
}));

const mockedHook = vi.mocked(useUpdateGroupChannel);
const updateGroupChannel = vi.fn();

function hookState(isPending = false) {
  return {
    updateGroupChannel,
    isPending,
    error: null,
  } as ReturnType<typeof useUpdateGroupChannel>;
}

function member(id: string): ChannelMember {
  return {
    id: Number(id.replace(/\D/g, "")) || 0,
    role: "MEMBER",
    user: { id, name: `User ${id}`, image: null, username: id },
  };
}

function channel(overrides: Partial<InboxChannel> = {}): InboxChannel {
  return {
    id: "chan-1",
    name: "Weekend Trip",
    type: "GROUP",
    displayName: "Weekend Trip",
    displayImage: "",
    channelMembers: [member("auth-1"), member("u2"), member("u3")],
    lastMessage: { content: "", createdAt: "2026-01-01T00:00:00.000Z" },
    messages: [],
    recipient: null,
    ...overrides,
  };
}

beforeEach(() => {
  mockedHook.mockReturnValue(hookState());
});

describe("update GroupChannelForm", () => {
  it("scopes the update hook to the channel id", () => {
    render(<GroupChannelForm channel={channel()} />);

    expect(mockedHook).toHaveBeenCalledWith("chan-1");
  });

  it("prefills the name from the channel", async () => {
    render(<GroupChannelForm channel={channel()} />);

    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("Weekend Trip"),
    );
  });

  it("renders the update submit button", () => {
    render(<GroupChannelForm channel={channel()} />);

    expect(
      screen.getByRole("button", { name: /update group/i }),
    ).toBeInTheDocument();
  });

  it("updates with the name and members excluding the current user", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<GroupChannelForm channel={channel()} onSuccess={onSuccess} />);

    // Wait for the effect-driven reset to seed the form.
    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("Weekend Trip"),
    );

    await user.click(screen.getByRole("button", { name: /update group/i }));

    await waitFor(() =>
      expect(updateGroupChannel).toHaveBeenCalledWith({
        name: "Weekend Trip",
        memberIds: ["u2", "u3"],
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("blocks submission when the name is cleared", async () => {
    const user = userEvent.setup();
    render(<GroupChannelForm channel={channel()} />);

    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("Weekend Trip"),
    );

    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: /update group/i }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(updateGroupChannel).not.toHaveBeenCalled();
  });

  it("disables the submit button while the mutation is pending", () => {
    mockedHook.mockReturnValue(hookState(true));

    render(<GroupChannelForm channel={channel()} />);

    expect(screen.getByRole("button", { name: /update group/i })).toBeDisabled();
  });
});
