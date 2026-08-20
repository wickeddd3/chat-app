import { fitImageBox } from "./image-box";

describe("fitImageBox", () => {
  it("scales a wide photo down to the maximum width, keeping its ratio", () => {
    const box = fitImageBox(1600, 900);

    expect(box.width).toBe(320);
    expect(box.height).toBe(180); // 16:9 preserved
  });

  it("bounds a tall photo by height instead, so it cannot run down the page", () => {
    const box = fitImageBox(1000, 4000);

    expect(box.height).toBe(400);
    expect(box.width).toBe(100);
  });

  it("leaves a photo smaller than the box at its own size", () => {
    // Scaling up would only blur it.
    expect(fitImageBox(120, 80)).toEqual({ width: 120, height: 80 });
  });

  it("falls back to a 4:3 box when the dimensions are unknown", () => {
    // Older messages predate the stored dimensions, and some files will not
    // decode — the row still has to reserve a sensible height.
    const expected = { width: 320, height: 240 };

    expect(fitImageBox(null, null)).toEqual(expected);
    expect(fitImageBox(undefined, undefined)).toEqual(expected);
    expect(fitImageBox(0, 0)).toEqual(expected);
    expect(fitImageBox(800, null)).toEqual(expected);
  });

  it("ignores nonsense dimensions rather than producing a negative box", () => {
    expect(fitImageBox(-100, -50)).toEqual({ width: 320, height: 240 });
  });
});
