import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarUploadDialog } from "./AvatarUploadDialog";
import { UploadAbortedError } from "@/shared/lib/supabase-upload";

// react-easy-crop measures the DOM, which jsdom cannot do. Stub it and report a
// crop area so the Save path is reachable — from an effect, not during render:
// setting parent state while rendering re-renders this child and loops forever.
vi.mock("react-easy-crop", async () => {
  const { useEffect } = await import("react");

  // Named and capitalised so the hooks lint rule recognises it as a component.
  function MockCropper({
    onCropComplete,
  }: {
    onCropComplete: (a: unknown, b: unknown) => void;
  }) {
    useEffect(() => {
      const area = { x: 0, y: 0, width: 100, height: 100 };
      onCropComplete(area, area);
      // Fire once on mount; `onCropComplete` is a fresh closure each render,
      // so depending on it would reintroduce the loop.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div data-testid="cropper" />;
  }

  return { default: MockCropper };
});

vi.mock("@/shared/lib/image-crop", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCroppedImageBlob: vi.fn().mockResolvedValue(new Blob(["x"])),
}));

const pngFile = () => {
  const file = new File(["x"], "avatar.png", { type: "image/png" });
  Object.defineProperty(file, "size", { value: 1024 });
  return file;
};

function renderDialog(
  props: Partial<React.ComponentProps<typeof AvatarUploadDialog>> = {},
) {
  const onUpload = props.onUpload ?? vi.fn().mockResolvedValue(undefined);
  render(
    <AvatarUploadDialog
      trigger={<button type="button">Change avatar</button>}
      title="Change avatar"
      description="Pick an image."
      onUpload={onUpload}
      {...props}
    />,
  );
  return { onUpload };
}

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Change avatar" }));
};

beforeAll(() => {
  // jsdom implements neither, and the dialog creates/revokes preview URLs.
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("AvatarUploadDialog", () => {
  it("shows the dropzone with the accepted formats and size limit", async () => {
    const user = userEvent.setup();
    renderDialog();

    await openDialog(user);

    expect(screen.getByText(/Click or drag an image here/)).toBeInTheDocument();
    expect(screen.getByText(/up to 5 MB/)).toBeInTheDocument();
  });

  it("rejects an image the browser cannot decode, without moving to the crop step", async () => {
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);

    // HEIC is what iPhones produce: `accept="image/*"` lets it through the file
    // picker, but no browser we target can decode it onto a canvas. A
    // non-image (a PDF) can't reach this branch at all — the accept filter
    // rejects it first — so it is covered by the validateImageFile unit test.
    await user.upload(
      screen.getByLabelText(/Click or drag an image here/i),
      new File(["x"], "photo.heic", { type: "image/heic" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /JPG, PNG, WebP or GIF/,
    );
    expect(screen.queryByTestId("cropper")).not.toBeInTheDocument();
  });

  it("moves to the crop step once a valid image is chosen", async () => {
    const user = userEvent.setup();
    renderDialog();
    await openDialog(user);

    await user.upload(
      screen.getByLabelText(/Click or drag an image here/i),
      pngFile(),
    );

    expect(await screen.findByTestId("cropper")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /zoom/i })).toBeInTheDocument();
  });

  it("uploads the cropped blob and reports progress", async () => {
    const user = userEvent.setup();
    // Hold the upload open so the progress UI is observable mid-flight.
    let reportProgress: ((n: number) => void) | undefined;
    const onUpload = vi.fn(
      (_blob: Blob, handlers: { onProgress: (n: number) => void }) =>
        new Promise<void>(() => {
          reportProgress = handlers.onProgress;
        }),
    );
    renderDialog({ onUpload });
    await openDialog(user);
    await user.upload(
      screen.getByLabelText(/Click or drag an image here/i),
      pngFile(),
    );

    await user.click(
      await screen.findByRole("button", { name: "Save avatar" }),
    );

    await waitFor(() => expect(onUpload).toHaveBeenCalled());
    reportProgress?.(42);

    expect(await screen.findByText(/Uploading… 42%/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel upload" }),
    ).toBeInTheDocument();
  });

  it("returns to the crop step on cancel rather than reporting an error", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn(
      (_blob: Blob, handlers: { signal: AbortSignal }) =>
        new Promise<void>((_resolve, reject) => {
          handlers.signal.addEventListener("abort", () =>
            reject(new UploadAbortedError()),
          );
        }),
    );
    renderDialog({ onUpload });
    await openDialog(user);
    await user.upload(
      screen.getByLabelText(/Click or drag an image here/i),
      pngFile(),
    );
    await user.click(
      await screen.findByRole("button", { name: "Save avatar" }),
    );
    await waitFor(() => expect(onUpload).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Cancel upload" }));

    expect(
      await screen.findByRole("button", { name: "Save avatar" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("surfaces an upload failure and keeps the crop so it can be retried", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn().mockRejectedValue(new Error("Payload too large"));
    renderDialog({ onUpload });
    await openDialog(user);
    await user.upload(
      screen.getByLabelText(/Click or drag an image here/i),
      pngFile(),
    );

    await user.click(
      await screen.findByRole("button", { name: "Save avatar" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Payload too large",
    );
    expect(screen.getByTestId("cropper")).toBeInTheDocument();
  });

  it("offers Remove only when there is an avatar to remove", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onRemove, currentImageUrl: "https://cdn/a.png" });
    await openDialog(user);

    await user.click(screen.getByRole("button", { name: /Remove photo/ }));

    expect(onRemove).toHaveBeenCalled();
  });

  it("hides Remove when no avatar is set", async () => {
    const user = userEvent.setup();
    renderDialog({ onRemove: vi.fn(), currentImageUrl: null });
    await openDialog(user);

    expect(
      screen.queryByRole("button", { name: /Remove photo/ }),
    ).not.toBeInTheDocument();
  });
});
