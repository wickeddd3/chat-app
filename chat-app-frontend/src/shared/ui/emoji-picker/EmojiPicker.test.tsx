import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiPicker } from "./EmojiPicker";
import { EMOJI_CATEGORIES } from "./emoji-data";

describe("EmojiPicker", () => {
  it("does not render the grid until opened", () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Insert emoji" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: EMOJI_CATEGORIES[0].emojis[0] })).not.toBeInTheDocument();
  });

  it("calls onSelect with the clicked emoji and stays open", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Insert emoji" }));

    const first = EMOJI_CATEGORIES[0].emojis[0];
    await user.click(screen.getByRole("button", { name: first }));

    expect(onSelect).toHaveBeenCalledWith(first);
    // Picker remains open for another pick.
    expect(screen.getByRole("button", { name: first })).toBeInTheDocument();
  });

  it("switches the grid when a category is selected", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Insert emoji" }));
    await user.click(screen.getByRole("button", { name: "Hearts & Symbols" }));

    const heart = "❤️";
    await user.click(screen.getByRole("button", { name: heart }));

    expect(onSelect).toHaveBeenCalledWith(heart);
  });
});
