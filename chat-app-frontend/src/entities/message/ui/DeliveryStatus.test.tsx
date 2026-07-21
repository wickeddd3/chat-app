import { render, screen } from "@testing-library/react";
import { DeliveryStatus } from "./DeliveryStatus";

describe("DeliveryStatus", () => {
  it("names each state for assistive tech, since colour alone can't carry it", () => {
    const { rerender } = render(<DeliveryStatus state="sending" />);
    expect(screen.getByRole("img", { name: "Sending" })).toBeInTheDocument();

    rerender(<DeliveryStatus state="delivered" />);
    expect(screen.getByRole("img", { name: "Delivered" })).toBeInTheDocument();

    rerender(<DeliveryStatus state="read" />);
    expect(screen.getByRole("img", { name: "Read" })).toBeInTheDocument();
  });

  it("pulses only while the message is in flight", () => {
    const { container, rerender } = render(<DeliveryStatus state="sending" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    rerender(<DeliveryStatus state="delivered" />);
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("tints only once the message has been read", () => {
    const { container, rerender } = render(
      <DeliveryStatus state="delivered" />,
    );
    expect(container.querySelector(".text-primary")).not.toBeInTheDocument();

    rerender(<DeliveryStatus state="read" />);
    expect(container.querySelector(".text-primary")).toBeInTheDocument();
  });

  it("changes shape in flight, so the states differ by more than tone", () => {
    const { container: sending } = render(<DeliveryStatus state="sending" />);
    const { container: delivered } = render(
      <DeliveryStatus state="delivered" />,
    );

    expect(sending.querySelector("svg")?.innerHTML).not.toBe(
      delivered.querySelector("svg")?.innerHTML,
    );
  });
});
