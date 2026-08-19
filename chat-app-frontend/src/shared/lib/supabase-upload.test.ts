import { uploadImageWithProgress, UploadAbortedError } from "./supabase-upload";

const { getSessionMock, getPublicUrlMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
}));

vi.mock("./supabase.client", () => ({
  supabase: {
    auth: { getSession: getSessionMock },
    storage: { from: () => ({ getPublicUrl: getPublicUrlMock }) },
  },
}));

vi.mock("../config/app.config", () => ({
  VITE_SUPABASE_URL: "https://project.supabase.co",
}));

/** Stands in for XMLHttpRequest so the test can drive progress and completion. */
class FakeXHR {
  static last: FakeXHR;

  upload = {
    onprogress: null as ((e: ProgressEvent) => void) | null,
    onload: null as (() => void) | null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  status = 200;
  responseText = "";
  headers: Record<string, string> = {};
  url = "";
  aborted = false;
  sent: unknown = null;

  constructor() {
    FakeXHR.last = this;
  }

  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }
  send(body: unknown) {
    this.sent = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }

  /** Drives a byte-progress tick. */
  emitProgress(loaded: number, total: number) {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded,
      total,
    } as ProgressEvent);
  }

  /** Completes the request with a status. */
  finish(status: number, responseText = "") {
    this.status = status;
    this.responseText = responseText;
    this.upload.onload?.();
    this.onload?.();
  }
}

const blob = new Blob(["data"], { type: "image/webp" });

beforeEach(() => {
  vi.stubGlobal("XMLHttpRequest", FakeXHR);
  getSessionMock.mockResolvedValue({
    data: { session: { access_token: "token-123" } },
  });
  getPublicUrlMock.mockReturnValue({
    data: { publicUrl: "https://cdn.example/avatar.webp" },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("uploadImageWithProgress", () => {
  it("posts to the storage REST endpoint with the session token", async () => {
    const promise = uploadImageWithProgress(blob, "u1/a.webp", "avatars");
    await vi.waitFor(() => expect(FakeXHR.last?.url).toBeTruthy());

    expect(FakeXHR.last.url).toBe(
      "https://project.supabase.co/storage/v1/object/avatars/u1/a.webp",
    );
    expect(FakeXHR.last.headers.Authorization).toBe("Bearer token-123");

    FakeXHR.last.finish(200);
    await expect(promise).resolves.toBe("https://cdn.example/avatar.webp");
  });

  it("reports byte progress as a percentage", async () => {
    const onProgress = vi.fn();
    const promise = uploadImageWithProgress(blob, "p", "avatars", {
      onProgress,
    });
    await vi.waitFor(() => expect(FakeXHR.last?.url).toBeTruthy());

    FakeXHR.last.emitProgress(25, 100);
    FakeXHR.last.emitProgress(50, 100);

    expect(onProgress).toHaveBeenCalledWith(25);
    expect(onProgress).toHaveBeenCalledWith(50);

    FakeXHR.last.finish(200);
    await promise;
  });

  it("ignores progress it cannot compute rather than reporting a fake percentage", async () => {
    const onProgress = vi.fn();
    const promise = uploadImageWithProgress(blob, "p", "avatars", {
      onProgress,
    });
    await vi.waitFor(() => expect(FakeXHR.last?.url).toBeTruthy());

    FakeXHR.last.upload.onprogress?.({
      lengthComputable: false,
      loaded: 10,
      total: 0,
    } as ProgressEvent);

    expect(onProgress).not.toHaveBeenCalled();

    FakeXHR.last.finish(200);
    await promise;
  });

  it("reaches 100% once the bytes are sent, before the server replies", async () => {
    const onProgress = vi.fn();
    const promise = uploadImageWithProgress(blob, "p", "avatars", {
      onProgress,
    });
    await vi.waitFor(() => expect(FakeXHR.last?.url).toBeTruthy());

    FakeXHR.last.upload.onload?.();
    expect(onProgress).toHaveBeenLastCalledWith(100);

    FakeXHR.last.finish(200);
    await promise;
  });

  it("surfaces the storage error message on a failure status", async () => {
    const promise = uploadImageWithProgress(blob, "p", "avatars");
    await vi.waitFor(() => expect(FakeXHR.last?.url).toBeTruthy());

    FakeXHR.last.finish(413, JSON.stringify({ message: "Payload too large" }));

    await expect(promise).rejects.toThrow("Payload too large");
  });

  it("falls back to the status code when the body is not JSON", async () => {
    const promise = uploadImageWithProgress(blob, "p", "avatars");
    await vi.waitFor(() => expect(FakeXHR.last?.url).toBeTruthy());

    FakeXHR.last.finish(500, "<html>nope</html>");

    await expect(promise).rejects.toThrow(/500/);
  });

  it("rejects with UploadAbortedError when the caller aborts, so a cancel reads as a cancel", async () => {
    const controller = new AbortController();
    const promise = uploadImageWithProgress(blob, "p", "avatars", {
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(FakeXHR.last?.url).toBeTruthy());

    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(UploadAbortedError);
    expect(FakeXHR.last.aborted).toBe(true);
  });

  it("does not start a request that is aborted before it begins", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      uploadImageWithProgress(blob, "p", "avatars", {
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(UploadAbortedError);
  });

  it("refuses to upload without a session", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    await expect(uploadImageWithProgress(blob, "p", "avatars")).rejects.toThrow(
      /signed in/,
    );
  });
});
