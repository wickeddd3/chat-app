export const createUploadPath = (userId: string, file: File): string => {
  // Generate a unique file path for the uploaded file
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}${Math.random()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  return filePath;
};

/** Formats we can decode, crop on a canvas, and re-encode. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** "2.4 MB" — for telling someone how far over the limit they are. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks a picked file before anything is uploaded, returning a message to show
 * or null when it's fine.
 *
 * Client-side only — the storage bucket enforces its own limits, and this exists
 * so the user hears about a 20 MB photo immediately rather than after waiting
 * for the upload to be rejected.
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "That file isn't a supported image. Use a JPG, PNG, WebP or GIF.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_IMAGE_BYTES)}.`;
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  return null;
}

export const generatePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

export const getFileData = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    return e.target.files[0];
  }
  return null;
};
