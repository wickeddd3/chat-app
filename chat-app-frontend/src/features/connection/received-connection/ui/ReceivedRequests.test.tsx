import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { ReceivedRequests } from "./ReceivedRequests";
import { useReceivedConnectionRequests } from "../model/useReceivedConnectionRequests";
import type { Connection } from "@/entities/connection";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useReceivedConnectionRequests", () => ({
  useReceivedConnectionRequests: vi.fn(),
}));

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data = [],
    itemContent,
    components,
  }: {
    data?: unknown[];
    itemContent: (index: number, item: unknown) => ReactNode;
    components?: { Footer?: ComponentType };
  }) => (
    <div data-testid="virtuoso">
      {data.map((item, index) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
      {components?.Footer ? <components.Footer /> : null}
    </div>
  ),
}));

const mockedHook = vi.mocked(useReceivedConnectionRequests);

// Injected buttons render the ids they receive, so we can assert wiring.
function AcceptButton({
  connectionRequestId,
}: {
  text: string;
  connectionRequestId: string;
}) {
  return <button type="button" data-testid={`accept-${connectionRequestId}`} />;
}

function DeclineButton({
  connectionRequestId,
  connectionRequestUserId,
}: {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}) {
  return (
    <button
      type="button"
      data-testid={`decline-${connectionRequestId}-${connectionRequestUserId}`}
    />
  );
}

function renderReceived() {
  return render(
    <ReceivedRequests
      acceptButton={AcceptButton}
      declineButton={DeclineButton}
    />,
  );
}

function request(id: string): Connection {
  return {
    id,
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: { id: `user-${id}`, name: `Jane ${id}`, username: `jane${id}` },
  };
}

function hookState(
  overrides: Partial<ReturnType<typeof useReceivedConnectionRequests>> = {},
) {
  return {
    receivedRequests: [],
    isLoading: false,
    isEmpty: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useReceivedConnectionRequests>;
}

describe("ReceivedRequests", () => {
  it("shows the loading skeleton while loading", () => {
    mockedHook.mockReturnValue(hookState({ isLoading: true, isEmpty: true }));

    renderReceived();

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows the empty placeholder when there are no requests", () => {
    mockedHook.mockReturnValue(hookState({ isEmpty: true }));

    renderReceived();

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso")).not.toBeInTheDocument();
  });

  it("renders a row per request with accept and decline actions wired to its ids", () => {
    mockedHook.mockReturnValue(
      hookState({ receivedRequests: [request("1"), request("2")] }),
    );

    renderReceived();

    expect(screen.getByText("Jane 1")).toBeInTheDocument();
    expect(screen.getByText("@jane1")).toBeInTheDocument();

    expect(screen.getByTestId("accept-1")).toBeInTheDocument();
    expect(screen.getByTestId("decline-1-user-1")).toBeInTheDocument();
    expect(screen.getByTestId("accept-2")).toBeInTheDocument();
    expect(screen.getByTestId("decline-2-user-2")).toBeInTheDocument();
  });

  it("scopes the request query to the authenticated user", () => {
    mockedHook.mockReturnValue(hookState({ isEmpty: true }));

    renderReceived();

    expect(mockedHook).toHaveBeenCalledWith("auth-1");
  });
});
