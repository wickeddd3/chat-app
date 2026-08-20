/** Widest a photo may render in a bubble, in px. */
const MAX_WIDTH = 320;

/**
 * Tallest, for a portrait shot. Past this the image is cropped to the box
 * rather than turning the bubble into a column the reader has to scroll past.
 */
const MAX_HEIGHT = 400;

/**
 * Fits a photo into the bubble's box, preserving its aspect ratio.
 *
 * Done from the stored dimensions rather than by letting the image size itself,
 * so the row reserves its final height before a byte of the photo arrives —
 * otherwise every image that loads shoves the timeline around it.
 */
export function fitImageBox(
  width?: number | null,
  height?: number | null,
): { width: number; height: number } {
  // Unknown dimensions (an older message, or a photo we could not measure):
  // fall back to a 4:3 box, which is wrong less often than a square.
  if (!width || !height || width <= 0 || height <= 0) {
    return { width: MAX_WIDTH, height: Math.round((MAX_WIDTH * 3) / 4) };
  }

  const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
