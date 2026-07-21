import { render, screen } from "@testing-library/react";
import { DayDivider } from "./DayDivider";

describe("DayDivider", () => {
  const now = new Date(2026, 0, 15, 12, 0, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("names the current day", () => {
    render(<DayDivider date={new Date(2026, 0, 15, 9, 0, 0).toISOString()} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("dates an older day and leads with its weekday", () => {
    // 8 January 2026 was a Thursday.
    render(<DayDivider date={new Date(2026, 0, 8, 9, 0, 0).toISOString()} />);

    expect(screen.getByText(/Thursday|Thu/i)).toBeInTheDocument();
    expect(screen.getByText(/January|Jan/i)).toBeInTheDocument();
  });

  it("renders nothing rather than an empty pill for an unusable date", () => {
    const { container } = render(<DayDivider date="not-a-date" />);

    expect(container).toBeEmptyDOMElement();
  });
});
