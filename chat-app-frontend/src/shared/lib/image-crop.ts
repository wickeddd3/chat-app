/** The crop rectangle in source-image pixels, as react-easy-crop reports it. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Avatars are rendered small and always round, so there is nothing to gain from
 * storing the original resolution — and plenty to lose in upload time.
 */
const OUTPUT_SIZE = 512;
const OUTPUT_TYPE = "image/webp";
const OUTPUT_QUALITY = 0.9;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // The source is a blob: URL from the user's own pick, but this keeps the
    // canvas untainted if that ever changes to a remote URL.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be read."));
    image.src = src;
  });
}

/**
 * Renders the chosen crop to a square canvas and re-encodes it.
 *
 * Downscaling to a fixed square here — rather than uploading the original and
 * resizing on read — means a 5 MB phone photo becomes a few tens of KB before it
 * ever leaves the browser, which is most of why the upload feels quick.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: CropArea,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process that image.");

  // Smooth downscale; the default is nearest-neighbour-ish on big reductions.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("That image could not be processed."));
      },
      OUTPUT_TYPE,
      OUTPUT_QUALITY,
    );
  });
}

/** Extension matching what `getCroppedImageBlob` encodes, for the storage path. */
export const CROPPED_IMAGE_EXTENSION = "webp";
