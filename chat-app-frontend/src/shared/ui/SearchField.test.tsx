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

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("hello");
  });

  it("emits the typed value through onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchField value="" onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Search" }), "a");

    expect(onChange).toHaveBeenCalledWith("a");
  });
});
