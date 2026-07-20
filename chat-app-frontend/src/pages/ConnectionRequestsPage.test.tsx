import { render, screen } from "@testing-library/react";
import ConnectionRequestsPage from "./ConnectionRequestsPage";
import { useSentConnectionRequests } from "@/features/connection/sent-connection";
import { useReceivedConnectionRequests } from "@/features/connection/received-connection";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("@/features/connection/sent-connection", () => ({
  SentRequests: () => <div data-testid="sent-list" />,
  useSentConnectionRequests: vi.fn(),
}));

vi.mock("@/features/connection/received-connection", () => ({
  ReceivedRequests: () => <div data-testid="received-list" />,
  useReceivedConnectionRequests: vi.fn(),
}));

vi.mock("@/features/connection/accept-connection", () => ({
  AcceptButton: () => null,
}));
vi.mock("@/features/connection/decline-connection", () => ({
  DeclineButton: () => null,
}));
vi.mock("@/features/connection/cancel-connection", () => ({
  CancelButton: () => null,
}));

const mockedSent = vi.mocked(useSentConnectionRequests);
const mockedReceived = vi.mocked(useReceivedConnectionRequests);

function state(total: number) {
  return {
    isLoading: false,
    isEmpty: total === 0,
    total,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  };
}

describe("ConnectionRequestsPage", () => {
  it("shows the server-reported totals on the Received and Sent tabs", () => {
    // Only a page of each is loaded, but the badges must report the server totals.
    mockedReceived.mockReturnValue({
      ...state(12),
      receivedRequests: [],
    } as ReturnType<typeof useReceivedConnectionRequests>);
    mockedSent.mockReturnValue({
      ...state(5),
      sentRequests: [],
    } as ReturnType<typeof useSentConnectionRequests>);

    render(<ConnectionRequestsPage />);

    expect(screen.getByRole("tab", { name: /received/i })).toHaveTextContent(
      "12",
    );
    expect(screen.getByRole("tab", { name: /sent/i })).toHaveTextContent("5");
  });

  it("scopes both totals to the authenticated user", () => {
    mockedReceived.mockReturnValue({
      ...state(0),
      receivedRequests: [],
    } as ReturnType<typeof useReceivedConnectionRequests>);
    mockedSent.mockReturnValue({
      ...state(0),
      sentRequests: [],
    } as ReturnType<typeof useSentConnectionRequests>);

    render(<ConnectionRequestsPage />);

    expect(mockedReceived).toHaveBeenCalledWith("auth-1");
    expect(mockedSent).toHaveBeenCalledWith("auth-1");
  });
});
