import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { UserList } from "./UserList";
import { useUsers } from "../model/useUsers";
import type { User } from "@/entities/user";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useUsers", () => ({
  useUsers: vi.fn(),
}));

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data = [],
    itemContent,
  }: {
    data?: unknown[];
    itemContent: (index: number, item: unknown) => ReactNode;
  }) => (
    <div data-testid="virtuoso">
      {data.map((item, index) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}));

const mockedUseUsers = vi.mocked(useUsers);

// Each injected button renders the ids it receives, so we can assert which
// button variant a given connectionStatus produced and how it was wired.
const SendButton = ({ receiverId }: { text: string; receiverId: string }) => (
  <button type="button" data-testid={`send-${receiverId}`} />
);
const MessageButton = ({
  targetUserId,
}: {
  text: string;
  targetUserId: string;
}) => <button type="button" data-testid={`message-${targetUserId}`} />;
const CancelButton = ({
  connectionRequestId,
  connectionRequestUserId,
}: {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}) => (
  <button
    type="button"
    data-testid={`cancel-${connectionRequestId}-${connectionRequestUserId}`}
  />
);
const DeclineButton = ({
  connectionRequestId,
  connectionRequestUserId,
}: {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}) => (
  <button
    type="button"
    data-testid={`decline-${connectionRequestId}-${connectionRequestUserId}`}
  />
);
const AcceptButton = ({
  connectionRequestId,
}: {
  text: string;
  connectionRequestId: string;
}) => <button type="button" data-testid={`accept-${connectionRequestId}`} />;

function renderUserList() {
  return render(
    <UserList
      messageButton={MessageButton}
      sendButton={SendButton}
      cancelButton={CancelButton}
      declineButton={DeclineButton}
      acceptButton={AcceptButton}
    />,
  );
}

function user(id: string, overrides: Partial<User> = {}): User {
  return {
    id,
    name: `User ${id}`,
    username: `user${id}`,
    connectionStatus: "STRANGER",
    connectionId: null,
    ...overrides,
  };
}

function usersState(
  users: User[],
  overrides: Partial<ReturnType<typeof useUsers>> = {},
) {
  return {
    users,
    isLoading: false,
    isEmpty: users.length === 0,
    error: null,
    ...overrides,
  } as ReturnType<typeof useUsers>;
}

describe("UserList", () => {
  it("shows the loading skeleton while loading", () => {
    mockedUseUsers.mockReturnValue(
      usersState([], { isLoading: true, isEmpty: false }),
    );

    renderUserList();

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows the empty placeholder when there are no users", () => {
    mockedUseUsers.mockReturnValue(usersState([]));

    renderUserList();

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso")).not.toBeInTheDocument();
  });

  it("renders an Add Contact button for strangers", () => {
    mockedUseUsers.mockReturnValue(usersState([user("1")]));

    renderUserList();

    expect(screen.getByTestId("send-1")).toBeInTheDocument();
  });

  it("renders a Message button for existing contacts", () => {
    mockedUseUsers.mockReturnValue(
      usersState([user("2", { connectionStatus: "CONTACT" })]),
    );

    renderUserList();

    expect(screen.getByTestId("message-2")).toBeInTheDocument();
  });

  it("renders a Cancel button for pending-sent requests using the connection id", () => {
    mockedUseUsers.mockReturnValue(
      usersState([
        user("3", { connectionStatus: "PENDING_SENT", connectionId: "conn-3" }),
      ]),
    );

    renderUserList();

    expect(screen.getByTestId("cancel-conn-3-3")).toBeInTheDocument();
  });

  it("renders Decline and Accept buttons for pending-received requests", () => {
    mockedUseUsers.mockReturnValue(
      usersState([
        user("4", {
          connectionStatus: "PENDING_RECEIVED",
          connectionId: "conn-4",
        }),
      ]),
    );

    renderUserList();

    expect(screen.getByTestId("decline-conn-4-4")).toBeInTheDocument();
    expect(screen.getByTestId("accept-conn-4")).toBeInTheDocument();
  });

  it("omits pending actions when the connection id is missing", () => {
    mockedUseUsers.mockReturnValue(
      usersState([
        user("5", { connectionStatus: "PENDING_SENT", connectionId: null }),
      ]),
    );

    renderUserList();

    expect(screen.queryByTestId("cancel-null-5")).not.toBeInTheDocument();
    // Row still renders, just without an action.
    expect(screen.getByText("User 5")).toBeInTheDocument();
  });

  it("scopes the users query to the authenticated user", () => {
    mockedUseUsers.mockReturnValue(usersState([]));

    renderUserList();

    expect(mockedUseUsers).toHaveBeenCalledWith("auth-1", "");
  });
});
