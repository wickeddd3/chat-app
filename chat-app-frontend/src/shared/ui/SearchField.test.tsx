import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchField } from "./SearchField";

describe("SearchField", () => {
  it("uses a default Search accessible name", () => {
    render(<SearchField value="" onChange={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
  });

  it("supports a custom aria-label", () => {
    render(
      <SearchField value="" onChange={vi.fn()} ariaLabel="Search contacts" />,
    );

    expect(
      screen.getByRole("textbox", { name: "Search contacts" }),
    ).toBeInTheDocument();
  });

  it("renders the controlled value", () => {
    render(<SearchField value="hello" onChange={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue(
      "hello",
    );
  });

  it("emits the typed value through onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchField value="" onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Search" }), "a");

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("offers no clear button while the field is empty", () => {
    render(<SearchField value="" onChange={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });

  it("clears the field back to empty", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchField value="alice" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("gives each field its own control id", () => {
    render(
      <>
        <SearchField value="" onChange={vi.fn()} ariaLabel="Search people" />
        <SearchField value="" onChange={vi.fn()} ariaLabel="Search contacts" />
      </>,
    );

    const first = screen.getByRole("textbox", { name: "Search people" });
    const second = screen.getByRole("textbox", { name: "Search contacts" });

    expect(first.id).not.toBe(second.id);
  });
});
