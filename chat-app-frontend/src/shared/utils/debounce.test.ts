import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call the function before the delay has elapsed", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    vi.advanceTimersByTime(499);

    expect(fn).not.toHaveBeenCalled();
  });

  it("calls the function once the delay has elapsed", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("collapses rapid successive calls into a single trailing call", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    vi.advanceTimersByTime(300);
    debounced();
    vi.advanceTimersByTime(300);
    debounced();
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls the function with the arguments from the most recent invocation", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced("first");
    debounced("second");
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });
});
