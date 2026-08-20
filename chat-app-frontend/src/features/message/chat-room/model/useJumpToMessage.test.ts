import { act, renderHook, waitFor } from "@testing-library/react";
import { createRef } from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import { useJumpToMessage } from "./useJumpToMessage";
import type { Message } from "@/entities/message";

function message(id: string): Message {
  return {
    id,
    author: { id: "user-1", name: "Jane", image: null },
    content: `content-${id}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    authorId: "user-1",
    channelId: "channel-1",
  };
}

interface SetupOptions {
  messages?: Message[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

/** The timeline's index space is offset by `firstItemIndex` — see Messages. */
const FIRST_ITEM_INDEX = 100;

function setup({
  messages = [],
  hasNextPage = false,
  isFetchingNextPage = false,
}: SetupOptions = {}) {
  const scrollToIndex = vi.fn();
  const fetchNextPage = vi.fn();
  const virtuosoRef = createRef<VirtuosoHandle>() as {
    current: VirtuosoHandle | null;
  };
  virtuosoRef.current = { scrollToIndex } as unknown as VirtuosoHandle;

  const view = renderHook(
    (props: SetupOptions) =>
      useJumpToMessage({
        messages: props.messages ?? messages,
        virtuosoRef,
        firstItemIndex: FIRST_ITEM_INDEX,
        hasNextPage: props.hasNextPage ?? hasNextPage,
        isFetchingNextPage: props.isFetchingNextPage ?? isFetchingNextPage,
        fetchNextPage,
      }),
    { initialProps: {} as SetupOptions },
  );

  return { ...view, scrollToIndex, fetchNextPage };
}

describe("useJumpToMessage", () => {
  it("scrolls to a loaded message in the timeline's index space", async () => {
    const { result, scrollToIndex } = setup({
      messages: [message("m-1"), message("m-2"), message("m-3")],
    });

    act(() => result.current.jumpToMessage("m-3"));

    await waitFor(() =>
      expect(scrollToIndex).toHaveBeenCalledWith(
        expect.objectContaining({ index: FIRST_ITEM_INDEX + 2 }),
      ),
    );
  });

  it("flashes the message it landed on", async () => {
    const { result } = setup({ messages: [message("m-1")] });

    act(() => result.current.jumpToMessage("m-1"));

    await waitFor(() => expect(result.current.highlightedId).toBe("m-1"));
  });

  it("stops flashing on its own, so the timeline settles", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result } = setup({ messages: [message("m-1")] });

      act(() => result.current.jumpToMessage("m-1"));
      await waitFor(() => expect(result.current.highlightedId).toBe("m-1"));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.highlightedId).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("loads older pages until the quoted message turns up, then lands on it", async () => {
    // A quote outlives the page it was quoted from, so the target is usually
    // not loaded when the jump starts.
    const { result, rerender, fetchNextPage, scrollToIndex } = setup({
      messages: [message("m-9")],
      hasNextPage: true,
    });

    act(() => result.current.jumpToMessage("m-1"));

    await waitFor(() => expect(fetchNextPage).toHaveBeenCalledTimes(1));
    expect(scrollToIndex).not.toHaveBeenCalled();

    rerender({
      messages: [message("m-1"), message("m-9")],
      hasNextPage: true,
    });

    await waitFor(() =>
      expect(scrollToIndex).toHaveBeenCalledWith(
        expect.objectContaining({ index: FIRST_ITEM_INDEX }),
      ),
    );
  });

  it("waits for a fetch already in flight instead of stacking another", async () => {
    const { result, fetchNextPage } = setup({
      messages: [message("m-9")],
      hasNextPage: true,
      isFetchingNextPage: true,
    });

    act(() => result.current.jumpToMessage("m-1"));

    await waitFor(() => expect(fetchNextPage).not.toHaveBeenCalled());
  });

  it("gives up quietly once the history runs out", async () => {
    const { result, fetchNextPage, scrollToIndex } = setup({
      messages: [message("m-9")],
      hasNextPage: false,
    });

    act(() => result.current.jumpToMessage("m-1"));

    await waitFor(() => expect(fetchNextPage).not.toHaveBeenCalled());
    expect(scrollToIndex).not.toHaveBeenCalled();
    expect(result.current.highlightedId).toBeNull();
  });

  it("does not resume an abandoned hunt when later messages arrive", async () => {
    // Otherwise every new message would restart the search for a target that
    // was already ruled out.
    const { result, rerender, fetchNextPage } = setup({
      messages: [message("m-9")],
      hasNextPage: false,
    });

    act(() => result.current.jumpToMessage("m-1"));
    await waitFor(() => expect(fetchNextPage).not.toHaveBeenCalled());

    rerender({ messages: [message("m-9"), message("m-10")], hasNextPage: true });

    await waitFor(() => expect(fetchNextPage).not.toHaveBeenCalled());
  });
});
