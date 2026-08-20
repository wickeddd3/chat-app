import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageImage } from "./MessageImage";

describe("MessageImage", () => {
  it("reserves the box from the stored dimensions before the photo loads", () => {
    // Without this the timeline jumps every time an image arrives.
    const { container } = render(
      <MessageImage src="https://cdn/photo.webp" width={1600} height={900} />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("width", "320");
    expect(image).toHaveAttribute("height", "180");
  });

  it("opens a stored photo full size", async () => {
    const user = userEvent.setup();
    render(<MessageImage src="https://cdn/photo.webp" />);

    await user.click(screen.getByRole("button", { name: "Open photo" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("reports upload progress rather than offering to open the photo", () => {
    render(<MessageImage src="blob:local" uploadProgress={40} />);

    const bar = screen.getByRole("progressbar", { name: "Uploading photo" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    // There is nothing stored to open yet.
    expect(
      screen.queryByRole("button", { name: "Open photo" }),
    ).not.toBeInTheDocument();
  });

  it("shows no progress once the photo is stored", () => {
    render(<MessageImage src="https://cdn/photo.webp" />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("offers a retry when the upload failed, in place of the progress ring", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <MessageImage
        src="blob:local"
        uploadProgress={30}
        uploadFailed
        onRetry={onRetry}
      />,
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
