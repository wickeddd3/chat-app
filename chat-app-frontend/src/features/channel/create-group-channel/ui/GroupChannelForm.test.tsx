import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupChannelForm } from "./GroupChannelForm";
import { useCreateGroupChannel } from "../model/useCreateGroupChannel";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

// Keep the real zod schema; only stub the heavy member picker (data fetch +
// virtualized list) so the form's own validation/submit logic is under test.
vi.mock("@/entities/connection", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/connection")>();
  return {
    ...actual,
    MemberListField: ({ label }: { label: string }) => <div>{label}</div>,
  };
});

vi.mock("../model/useCreateGroupChannel", () => ({
  useCreateGroupChannel: vi.fn(),
}));

const mockedHook = vi.mocked(useCreateGroupChannel);
const createGroupChannel = vi.fn();

function hookState(isPending = false) {
  return {
    createGroupChannel,
    isPending,
    error: null,
  } as ReturnType<typeof useCreateGroupChannel>;
}

beforeEach(() => {
  mockedHook.mockReturnValue(hookState());
});

describe("create GroupChannelForm", () => {
  it("renders the name field and submit button", () => {
    render(<GroupChannelForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create group/i }),
    ).toBeInTheDocument();
  });

  it("blocks submission and shows an error when the name is empty", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<GroupChannelForm onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: /create group/i }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(createGroupChannel).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("creates the group and calls onSuccess with a valid name", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<GroupChannelForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Name"), "Weekend Trip");
    await user.click(screen.getByRole("button", { name: /create group/i }));

    await waitFor(() =>
      expect(createGroupChannel).toHaveBeenCalledWith({
        name: "Weekend Trip",
        memberIds: [],
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("disables the submit button while the mutation is pending", () => {
    mockedHook.mockReturnValue(hookState(true));

    render(<GroupChannelForm />);

    expect(screen.getByRole("button", { name: /create group/i })).toBeDisabled();
  });
});
