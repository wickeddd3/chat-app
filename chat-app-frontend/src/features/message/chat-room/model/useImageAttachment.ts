import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { validateImageFile, generatePreview } from "@/shared/utils/upload";

export interface ImageAttachment {
  file: File;
  /** Object URL for the local preview, shown until the stored photo replaces it. */
  previewUrl: string;
  /** Natural size, measured before sending so the bubble can reserve its box. */
  width: number | null;
  height: number | null;
}

/**
 * Reads a picked image's natural size.
 *
 * Resolves to nulls rather than rejecting when the file will not decode: the
 * dimensions are a layout nicety, and a photo the browser cannot measure can
 * still be uploaded and rendered (the bubble falls back to a 4:3 box).
 */
export function measureImage(
  objectUrl: string,
): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: null, height: null });
    image.src = objectUrl;
  });
}

/**
 * Holds the photo staged in the composer.
 *
 * Object URLs are owned here, because nothing else can know when they stop
 * being needed. A staged photo's URL is revoked as soon as it is replaced or
 * dropped; one that has been *sent* is handed off with `takeAttachment` and
 * held until the room unmounts, since the optimistic bubble renders from it
 * until the server echoes back the stored photo. Revoking at send time would
 * blank the sender's own image mid-upload.
 */
export function useImageAttachment(channelId: string) {
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);

  // Ref rather than state: this is cleanup bookkeeping, and nothing renders
  // from it.
  const sentUrlsRef = useRef<string[]>([]);

  const clearAttachment = useCallback(() => setAttachment(null), []);

  const attachImage = useCallback(async (file: File) => {
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }

    const previewUrl = generatePreview(file);
    const { width, height } = await measureImage(previewUrl);

    // Replacing a staged photo revokes the previous one — see the effect below.
    setAttachment({ file, previewUrl, width, height });
  }, []);

  /**
   * Hands the staged photo to the send, clearing the composer without revoking
   * its preview — the optimistic bubble is about to render from it.
   */
  const takeAttachment = useCallback((): ImageAttachment | null => {
    if (!attachment) return null;

    // Claimed before the state clears, so the cleanup below leaves it alone.
    sentUrlsRef.current.push(attachment.previewUrl);
    setAttachment(null);

    return attachment;
  }, [attachment]);

  // A staged photo belongs to the thread it was picked for, like a draft reply.
  const [stagedFor, setStagedFor] = useState(channelId);
  if (stagedFor !== channelId) {
    setStagedFor(channelId);
    setAttachment(null);
  }

  // One place to release a preview: whenever the staged photo is replaced,
  // dropped, or the room unmounts, the cleanup for that attachment runs. A
  // photo already handed to a send is skipped — its bubble is still drawing it.
  useEffect(() => {
    if (!attachment) return;

    const { previewUrl } = attachment;
    // The same array instance `takeAttachment` pushes into, captured here so the
    // cleanup reads the hand-offs made after this effect ran.
    const sentUrls = sentUrlsRef.current;

    return () => {
      if (!sentUrls.includes(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [attachment]);

  // Sent previews outlive their attachment, but not the room.
  useEffect(() => {
    const sentUrls = sentUrlsRef.current;
    return () => {
      sentUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  return { attachment, attachImage, clearAttachment, takeAttachment };
}
