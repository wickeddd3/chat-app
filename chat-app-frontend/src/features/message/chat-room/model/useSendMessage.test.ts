import { act, renderHook } from "@testing-library/react";

vi.mock("@/shared/lib/socket-io.client", () => ({
  webSocketClient: { emit: vi.fn() },
}));

vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ authUser: { id: "user-1" } }),
  useAuthProfile: () => ({
    authProfile: { id: "user-1", name: "Jane", image: null },
  }),
}));

import { webSocketClient } from "@/shared/lib/socket-io.client";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { useSendMessage } from "./useSendMessage";
import type { Message, NewMessage } from "@/entities/message";
import type { ReplyTarget } from "./useReplyTarget";

const emitSpy = vi.mocked(webSocketClient).emit;
const keys = createQueryKeys("user-1");

const replyTarget: ReplyTarget = {
  id: "m-0",
  content: "Did the migration land?",
  author: { id: "user-2", name: "Ada", image: null },
};

/** The optimistic write patches page 0 of the timeline, so it has to exist. */
function setup(target?: ReplyTarget) {
  const { queryClient, Wrapper } = createQueryClientWrapper();
  const onSent = vi.fn();

  queryClient.setQueryData(keys.messages.timeline("channel-1"), {
    pages: [{ messages: [] }],
    pageParams: [null],
  });

  const { result } = renderHook(
    () =>
      useSendMessage({
        channelId: "channel-1",
        ...(target && { replyTarget: target }),
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

  return { send, optimistic, sentPayload, onSent };
}

describe("useSendMessage", () => {
  beforeEach(() => {
    emitSpy.mockClear();
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
