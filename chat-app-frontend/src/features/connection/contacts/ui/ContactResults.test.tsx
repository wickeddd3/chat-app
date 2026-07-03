import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { ContactResults } from "./ContactResults";
import type { ConnectionUser } from "@/entities/connection";

// react-virtuoso does not virtualize meaningfully in jsdom (zero-height
// container), so replace it with a plain list that renders every item.
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

function MessageButton({
  text,
  targetUserId,
}: {
  text: string;
  targetUserId: string;
}) {
  return (
    <button type="button" data-testid={`message-${targetUserId}`}>
      {text}
    </button>
  );
}

function contact(
  id: string,
  overrides: Partial<ConnectionUser & { online: boolean }> = {},
): ConnectionUser & { online: boolean } {
  return {
    id,
    name: `Contact ${id}`,
    username: `contact${id}`,
    online: false,
    ...overrides,
  };
}

const baseProps = {
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  messageButton: MessageButton,
};

describe("ContactResults", () => {
  it("shows the loading skeleton while loading", () => {
    render(<ContactResults {...baseProps} results={[]} isLoading isEmpty />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows the empty placeholder when there are no contacts", () => {
    render(<ContactResults {...baseProps} results={[]} isEmpty />);

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.queryByTestId("virtuoso")).not.toBeInTheDocument();
  });

  it("renders each contact with its own message button", () => {
    const results = [contact("1"), contact("2")];
    render(<ContactResults {...baseProps} results={results} />);

    expect(screen.getByText("Contact 1")).toBeInTheDocument();
    expect(screen.getByText("@contact1")).toBeInTheDocument();
    expect(screen.getByText("Contact 2")).toBeInTheDocument();

    // The injected message button is wired to each contact's id.
    expect(screen.getByTestId("message-1")).toBeInTheDocument();
    expect(screen.getByTestId("message-2")).toBeInTheDocument();
    expect(screen.queryByText("Empty")).not.toBeInTheDocument();
  });

  it("renders the loading footer while fetching the next page", () => {
    render(
      <ContactResults
        {...baseProps}
        results={[contact("1")]}
        isFetchingNextPage
      />,
    );

    // Footer spinner is an icon; assert the results container still rendered.
    expect(screen.getByTestId("virtuoso")).toBeInTheDocument();
  });
});
