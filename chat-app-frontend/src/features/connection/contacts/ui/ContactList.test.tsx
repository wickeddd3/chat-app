import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { ContactList } from "./ContactList";
import { useContacts } from "@/entities/connection";
import type { ConnectionUser } from "@/entities/connection";

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "auth-1" } }),
  // Only "user-1" is online.
  usePresence: () => ({ isOnline: (id: string) => id === "user-1" }),
}));

vi.mock("@/entities/connection", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/connection")>();
  return { ...actual, useContacts: vi.fn() };
});

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

function MessageButton({ text }: { text: string; targetUserId: string }) {
  return <button type="button">{text}</button>;
}

const mockedHook = vi.mocked(useContacts);

function contact(id: string): ConnectionUser {
  return { id, name: `User ${id}`, username: id, image: null };
}

function hookState(
  contacts: ConnectionUser[],
  overrides: Partial<ReturnType<typeof useContacts>> = {},
) {
  return {
    contacts,
    isLoading: false,
    isEmpty: contacts.length === 0,
    total: contacts.length,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useContacts>;
}

describe("ContactList", () => {
  it("shows the server-reported total in the All tab", () => {
    // Only 2 contacts are loaded, but the server says there are 128 in total —
    // the badge must report the total, not the loaded length.
    mockedHook.mockReturnValue(
      hookState([contact("user-1"), contact("user-2")], { total: 128 }),
    );

    render(<ContactList messageButton={MessageButton} />);

    expect(screen.getByRole("tab", { name: /all/i })).toHaveTextContent("128");
  });

  it("keeps the Online count derived from the loaded contacts and live presence", () => {
    // Presence is client-side, so this count intentionally reflects only what's
    // loaded — 1 of the 2 loaded contacts is online, regardless of the total.
    mockedHook.mockReturnValue(
      hookState([contact("user-1"), contact("user-2")], { total: 128 }),
    );

    render(<ContactList messageButton={MessageButton} />);

    expect(screen.getByRole("tab", { name: /online/i })).toHaveTextContent("1");
  });
});
