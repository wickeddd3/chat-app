import { supabase } from "./supabase.client";
import { VITE_SUPABASE_URL } from "../config/app.config";

export const uploadImage = async (
  file: File,
  path: string,
  bucketName: string,
) => {
  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(path, file);

  // Handle upload error
  if (uploadError) throw uploadError;

  // Get Public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(path);

  return publicUrl;
};

export const removeImage = async (path: string, bucketName: string) => {
  const { error: deleteError } = await supabase.storage
    .from(bucketName)
    .remove([path]);

  if (deleteError) throw deleteError;
};

export interface UploadWithProgressOptions {
  /** Fired with 0–100 as bytes go out. */
  onProgress?: (percent: number) => void;
  /** Aborts the in-flight request. */
  signal?: AbortSignal;
}

/** Raised when the caller aborts, so callers can tell a cancel from a failure. */
export class UploadAbortedError extends Error {
  constructor() {
    super("Upload cancelled");
    this.name = "UploadAbortedError";
  }
}

/**
 * Uploads straight to Supabase Storage while reporting byte-level progress.
 *
 * `supabase.storage.upload()` is a `fetch` call, and fetch cannot report upload
 * progress in browsers — so this talks to the same Storage REST endpoint over
 * XMLHttpRequest, which does expose `upload.onprogress`. Staying direct-to-storage
 * keeps the file off our backend entirely; routing it through the API purely to
 * watch the bytes go by would double the bandwidth for every avatar.
 *
 * Resolves to the file's public URL.
 */
export async function uploadImageWithProgress(
  file: File | Blob,
  path: string,
  bucketName: string,
  { onProgress, signal }: UploadWithProgressOptions = {},
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) throw new Error("You need to be signed in to upload.");

  if (signal?.aborted) throw new UploadAbortedError();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `${VITE_SUPABASE_URL}/storage/v1/object/${bucketName}/${path}`;

    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      // `lengthComputable` is false for a stream of unknown size; reporting a
      // percentage then would be a lie, so leave the bar where it is.
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    // The bytes are gone but the server hasn't answered yet — show a full bar
    // rather than stalling at 99% while the response comes back.
    xhr.upload.onload = () => onProgress?.(100);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();

      // Storage errors come back as JSON; surface the message when there is one.
      let message = `Upload failed (${String(xhr.status)})`;
      try {
        const parsed: unknown = JSON.parse(xhr.responseText);
        if (parsed && typeof parsed === "object" && "message" in parsed) {
          message = String((parsed as { message: unknown }).message);
        }
      } catch {
        /* keep the status-code message */
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new UploadAbortedError());

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(file);
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(path);

  return publicUrl;
}
