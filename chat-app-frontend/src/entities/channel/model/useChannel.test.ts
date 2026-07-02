import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useChannel } from "./useChannel";
import { getChannel } from "../api/channels.api";
import type { InboxChannel } from "./channel.types";

vi.mock("../api/channels.api", () => ({
  getChannel: vi.fn(),
}));

const mockedGetChannel = vi.mocked(getChannel);

describe("useChannel", () => {
  it("fetches the channel by id on mount", async () => {
    mockedGetChannel.mockResolvedValue({ id: "channel-1" } as InboxChannel);
    const { Wrapper } = createQueryClientWrapper();

    renderHook(() => useChannel("channel-1", "auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(mockedGetChannel).toHaveBeenCalledWith("channel-1"),
    );
  });

  it("returns the channel once loaded", async () => {
    const channel = { id: "channel-1" } as InboxChannel;
    mockedGetChannel.mockResolvedValue(channel);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChannel("channel-1", "auth-user"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.channel).toEqual(channel);
  });

  it("does not fetch and returns a null channel when channelId is empty", () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useChannel("", "auth-user"), {
      wrapper: Wrapper,
    });

    expect(mockedGetChannel).not.toHaveBeenCalled();
    expect(result.current.channel).toBeNull();
  });
});
