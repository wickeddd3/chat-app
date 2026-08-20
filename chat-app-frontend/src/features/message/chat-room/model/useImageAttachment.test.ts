import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { toast } from "sonner";
import { useImageAttachment } from "./useImageAttachment";
import { MAX_IMAGE_BYTES } from "@/shared/utils/upload";

const photo = (name = "sunset.jpg", type = "image/jpeg") =>
  new File(["bytes"], name, { type });

/** Object URLs are a browser API jsdom does not implement. */
function stubObjectUrls() {
  let next = 0;
  const created: string[] = [];
  const revoked: string[] = [];

  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => {
      const url = `blob:${String(next++)}`;
      created.push(url);
      return url;
    }),
    revokeObjectURL: vi.fn((url: string) => revoked.push(url)),
  });

  return { created, revoked };
}

describe("useImageAttachment", () => {
  let urls: ReturnType<typeof stubObjectUrls>;

  beforeEach(() => {
    vi.clearAllMocks();
    urls = stubObjectUrls();
    // jsdom never fires load/error on an <img>, so measurement would hang.
    // Resolve it immediately with a known size.
    Object.defineProperty(globalThis.Image.prototype, "src", {
      configurable: true,
      set(this: HTMLImageElement) {
        Object.defineProperty(this, "naturalWidth", { value: 800 });
        Object.defineProperty(this, "naturalHeight", { value: 600 });
        setTimeout(() => this.onload?.(new Event("load")), 0);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stages a picked photo with a preview and its measured size", async () => {
    const { result } = renderHook(() => useImageAttachment("c-1"));

    await act(async () => {
      await result.current.attachImage(photo());
    });

    expect(result.current.attachment).toMatchObject({
      previewUrl: "blob:0",
      width: 800,
      height: 600,
    });
  });

  it("refuses a file that is not a supported image, and says why", async () => {
    const { result } = renderHook(() => useImageAttachment("c-1"));

    await act(async () => {
      await result.current.attachImage(photo("notes.pdf", "application/pdf"));
    });

    expect(result.current.attachment).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("supported image"),
    );
  });

  it("refuses a photo over the size limit before anything is uploaded", async () => {
    const huge = new File([], "huge.jpg", { type: "image/jpeg" });
    Object.defineProperty(huge, "size", { value: MAX_IMAGE_BYTES + 1 });
    const { result } = renderHook(() => useImageAttachment("c-1"));

    await act(async () => {
      await result.current.attachImage(huge);
    });

    expect(result.current.attachment).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it("releases the previous preview when the photo is replaced", async () => {
    const { result } = renderHook(() => useImageAttachment("c-1"));

    await act(async () => {
      await result.current.attachImage(photo());
    });
    await act(async () => {
      await result.current.attachImage(photo("other.png", "image/png"));
    });

    await waitFor(() => expect(urls.revoked).toContain("blob:0"));
    expect(result.current.attachment?.previewUrl).toBe("blob:1");
  });

  it("releases the preview when the photo is dropped", async () => {
    const { result } = renderHook(() => useImageAttachment("c-1"));

    await act(async () => {
      await result.current.attachImage(photo());
    });
    act(() => result.current.clearAttachment());

    await waitFor(() => expect(urls.revoked).toContain("blob:0"));
    expect(result.current.attachment).toBeNull();
  });

  it("keeps a sent photo's preview alive — its bubble is still drawing it", async () => {
    const { result } = renderHook(() => useImageAttachment("c-1"));

    await act(async () => {
      await result.current.attachImage(photo());
    });

    let taken;
    act(() => {
      taken = result.current.takeAttachment();
    });

    expect(taken).toMatchObject({ previewUrl: "blob:0" });
    expect(result.current.attachment).toBeNull();
    // Revoking here would blank the sender's own image mid-upload.
    await waitFor(() => expect(result.current.attachment).toBeNull());
    expect(urls.revoked).not.toContain("blob:0");
  });

  it("releases every sent preview once the room unmounts", async () => {
    const { result, unmount } = renderHook(() => useImageAttachment("c-1"));

    await act(async () => {
      await result.current.attachImage(photo());
    });
    act(() => {
      result.current.takeAttachment();
    });

    unmount();

    expect(urls.revoked).toContain("blob:0");
  });

  it("drops a staged photo when the room switches channels", async () => {
    const { result, rerender } = renderHook(
      ({ channelId }) => useImageAttachment(channelId),
      { initialProps: { channelId: "c-1" } },
    );

    await act(async () => {
      await result.current.attachImage(photo());
    });
    rerender({ channelId: "c-2" });

    expect(result.current.attachment).toBeNull();
    await waitFor(() => expect(urls.revoked).toContain("blob:0"));
  });
});
