import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { SentRequests } from "./SentRequests";
import { useSentConnectionRequests } from "../model/useSentConnectionRequests";
import type { Connection } from "@/entities/connection";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
}));

vi.mock("../model/useSentConnectionRequests", () => ({
  useSentConnectionRequests: vi.fn(),
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

const mockedHook = vi.mocked(useSentConnectionRequests);

function CancelButton({
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
      data-testid={`cancel-${connectionRequestId}-${connectionRequestUserId}`}
    />
  );
}

function renderSent() {
  return render(<SentRequests cancelButton={CancelButton} />);
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
  overrides: Partial<ReturnType<typeof useSentConnectionRequests>> = {},
) {
  return {
    sentRequests: [],
    isLoading: false,
    isEmpty: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useSentConnectionRequests>;
}

describe("SentRequests", () => {
  it("shows the loading skeleton while loading", () => {
    mockedHook.mockReturnValue(hookState({ isLoading: true, isEmpty: true }));

    renderSent();

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows the empty placeholder when there are no requests", () => {
    mockedHook.mockReturnValue(hookState({ isEmpty: true }));

    renderSent();

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso")).not.toBeInTheDocument();
  });

  it("renders a row per request with a cancel action wired to its ids", () => {
    mockedHook.mockReturnValue(
      hookState({ sentRequests: [request("1"), request("2")] }),
    );

    renderSent();

    expect(screen.getByText("Jane 1")).toBeInTheDocument();
    expect(screen.getByText("@jane2")).toBeInTheDocument();

    expect(screen.getByTestId("cancel-1-user-1")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-2-user-2")).toBeInTheDocument();
  });

  it("scopes the request query to the authenticated user", () => {
    mockedHook.mockReturnValue(hookState({ isEmpty: true }));

    renderSent();

    expect(mockedHook).toHaveBeenCalledWith("auth-1");
  });
});
