import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("@/shared/lib/socket-io.client", () => ({
  webSocketClient: { emit: vi.fn() },
}));

vi.mock("@/shared/lib/supabase-upload", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/shared/lib/supabase-upload")>();
  return { ...actual, uploadImageWithProgress: vi.fn() };
});

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "user-1" } }),
  useAuthProfile: () => ({
    authProfile: { id: "user-1", name: "Jane", image: null },
  }),
}));

import { webSocketClient } from "@/shared/lib/socket-io.client";
import {
  uploadImageWithProgress,
  UploadAbortedError,
  type UploadWithProgressOptions,
} from "@/shared/lib/supabase-upload";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { useSendMessage } from "./useSendMessage";
import type { Message, NewMessage } from "@/entities/message";
import type { ReplyTarget } from "./useReplyTarget";
import type { ImageAttachment } from "./useImageAttachment";

const emitSpy = vi.mocked(webSocketClient).emit;
const uploadSpy = vi.mocked(uploadImageWithProgress);

function imageAttachment(): ImageAttachment {
  return {
    file: new File(["bytes"], "sunset.jpg", { type: "image/jpeg" }),
    previewUrl: "blob:local-preview",
    width: 1200,
    height: 800,
  };
}
const keys = createQueryKeys("user-1");

const replyTarget: ReplyTarget = {
  id: "m-0",
  content: "Did the migration land?",
  author: { id: "user-2", name: "Ada", image: null },
};

/** The optimistic write patches page 0 of the timeline, so it has to exist. */
function setup(target?: ReplyTarget, attachment?: ImageAttachment) {
  const { queryClient, Wrapper } = createQueryClientWrapper();
  const onSent = vi.fn();
  // Mirrors the composer: the photo is handed over once, then the field is bare.
  let staged = attachment ?? null;
  const takeAttachment = vi.fn(() => {
    const taken = staged;
    staged = null;
    return taken;
  });

  // The hook only writes this entry — it never subscribes — so with the
  // wrapper's `gcTime: 0` it would be collected the moment a test awaits.
  queryClient.setQueryDefaults(keys.messages.timeline("channel-1"), {
    gcTime: Infinity,
  });
  queryClient.setQueryData(keys.messages.timeline("channel-1"), {
    pages: [{ messages: [] }],
    pageParams: [null],
  });

  const { result } = renderHook(
    () =>
      useSendMessage({
        channelId: "channel-1",
        ...(target && { replyTarget: target }),
        takeAttachment,
        onSent,
      }),
    { wrapper: Wrapper },
  );

  const send = (text: string) => {
    act(() => result.current.setMessage(text));
    act(() => result.current.sendMessage({ preventDefault: vi.fn() } as never));
  };

  const optimistic = () =>
    (
      queryClient.getQueryData(keys.messages.timeline("channel-1")) as {
        pages: { messages: (Message | NewMessage)[] }[];
      }
    ).pages[0].messages;

  const sentPayload = () =>
    emitSpy.mock.calls.find(([event]) => event === "message:send_message")?.[1];

  const retry = (clientId: string) => {
    act(() => result.current.retryUpload(clientId));
  };

  return { send, optimistic, sentPayload, onSent, retry };
}

describe("useSendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadSpy.mockResolvedValue("https://cdn/stored.webp");
  });

  it("sends a plain message with no reply link at all", () => {
    // The server's schema takes parentId as optional, not nullable — sending
    // an explicit null would be rejected as an invalid payload.
    const { send, sentPayload, optimistic } = setup();

    send("hello");

    expect(sentPayload()).toEqual({
      channelId: "channel-1",
      clientId: expect.any(String),
      content: "hello",
    });
    expect(optimistic()[0]).not.toHaveProperty("parentId");
  });

  it("links a reply to its target when one is staged", () => {
    const { send, sentPayload } = setup(replyTarget);

    send("it did");

    expect(sentPayload()).toMatchObject({ parentId: "m-0", content: "it did" });
  });

  it("draws the quote optimistically, before the server echoes the reply back", () => {
    const { send, optimistic } = setup(replyTarget);

    send("it did");

    expect(optimistic()[0]).toMatchObject({
      content: "it did",
      isSending: true,
      parentId: "m-0",
      parent: replyTarget,
    });
  });

  it("retires the staged reply once the message is away", () => {
    const { send, onSent } = setup(replyTarget);

    send("it did");

    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("neither sends nor retires the reply on an empty draft", () => {
    const { send, sentPayload, onSent } = setup(replyTarget);

    send("   ");

    expect(sentPayload()).toBeUndefined();
    expect(onSent).not.toHaveBeenCalled();
  });
});

describe("useSendMessage (photos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadSpy.mockResolvedValue("https://cdn/stored.webp");
  });

  it("shows the photo from its local preview before the upload finishes", async () => {
    const { send, optimistic } = setup(undefined, imageAttachment());

    send("");

    expect(optimistic()[0]).toMatchObject({
      previewUrl: "blob:local-preview",
      imageWidth: 1200,
      imageHeight: 800,
      isSending: true,
    });
  });

  it("uploads to a path the storage policy can authorise", async () => {
    const { send } = setup(undefined, imageAttachment());

    send("");

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));
    const [file, path, bucket] = uploadSpy.mock.calls[0];
    expect(file).toBeInstanceOf(File);
    expect(bucket).toBe("message-images");
    // <channelId>/<userId>/<timestamp>.<ext> — the policy reads the second
    // segment to decide who may delete it.
    expect(path).toMatch(/^channel-1\/user-1\/\d+\.jpg$/);
  });

  it("sends the message only once the photo is stored, pointing at it", async () => {
    const { send, sentPayload } = setup(undefined, imageAttachment());

    send("look at this");

    // Nothing is sent while the bytes are still going out.
    expect(sentPayload()).toBeUndefined();

    await waitFor(() =>
      expect(sentPayload()).toMatchObject({
        content: "look at this",
        imageUrl: "https://cdn/stored.webp",
        imageWidth: 1200,
        imageHeight: 800,
      }),
    );
  });

  it("reports progress onto the message as the bytes go out", async () => {
    let report: ((percent: number) => void) | undefined;
    uploadSpy.mockImplementation(
      async (_file, _path, _bucket, options?: UploadWithProgressOptions) => {
        report = options?.onProgress;
        return new Promise<string>(() => {
          /* held open, so the message stays mid-upload */
        });
      },
    );

    const { send, optimistic } = setup(undefined, imageAttachment());
    send("");

    await waitFor(() => expect(report).toBeDefined());
    act(() => report?.(40));

    await waitFor(() =>
      expect(optimistic()[0]).toMatchObject({ uploadProgress: 40 }),
    );
  });

  it("marks the message failed rather than dropping it, so it can be retried", async () => {
    uploadSpy.mockRejectedValue(new Error("Network error during upload."));
    const { send, optimistic, sentPayload } = setup(
      undefined,
      imageAttachment(),
    );

    send("");

    await waitFor(() =>
      expect(optimistic()[0]).toMatchObject({ uploadFailed: true }),
    );
    // The photo never reached storage, so no message may point at it.
    expect(sentPayload()).toBeUndefined();
  });

  it("retries a failed upload without the photo being picked again", async () => {
    uploadSpy.mockRejectedValueOnce(new Error("Network error during upload."));
    const { send, optimistic, sentPayload, retry } = setup(
      undefined,
      imageAttachment(),
    );

    send("");
    await waitFor(() =>
      expect(optimistic()[0]).toMatchObject({ uploadFailed: true }),
    );

    const clientId = optimistic()[0].clientId as string;
    retry(clientId);

    await waitFor(() =>
      expect(sentPayload()).toMatchObject({
        imageUrl: "https://cdn/stored.webp",
      }),
    );
  });

  it("leaves a cancelled upload alone rather than marking it failed", async () => {
    uploadSpy.mockRejectedValue(new UploadAbortedError());
    const { send, optimistic } = setup(undefined, imageAttachment());

    send("");

    await waitFor(() => expect(uploadSpy).toHaveBeenCalled());
    expect(optimistic()[0]).not.toMatchObject({ uploadFailed: true });
  });

  it("carries a reply and a photo together", async () => {
    const { send, sentPayload } = setup(replyTarget, imageAttachment());

    send("");

    await waitFor(() =>
      expect(sentPayload()).toMatchObject({
        parentId: "m-0",
        imageUrl: "https://cdn/stored.webp",
      }),
    );
  });
});
