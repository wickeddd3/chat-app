import { renderHook, waitFor } from "@testing-library/react";
import { createQueryClientWrapper } from "@/test/create-query-client-wrapper";
import { useAuthProfile } from "./useAuthProfile";
import { getAuthProfile } from "../api/auth.api";
import type { AuthUser } from "./auth.types";

vi.mock("../api/auth.api", () => ({
  getAuthProfile: vi.fn(),
}));

const mockedGetAuthProfile = vi.mocked(getAuthProfile);

describe("useAuthProfile", () => {
  const authUser: AuthUser = {
    id: "user-1",
    name: "Jane",
    email: "jane@example.com",
    username: "jane",
    image: "jane.png",
  };

  it("returns null while the profile is loading", () => {
    mockedGetAuthProfile.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAuthProfile("user-1"), {
      wrapper: Wrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.authProfile).toBeNull();
  });

  it("returns the fetched profile once loaded", async () => {
    mockedGetAuthProfile.mockResolvedValue(authUser);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAuthProfile("user-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.authProfile).toEqual(authUser);
    expect(result.current.error).toBeNull();
  });

  it("surfaces a failed fetch as an error", async () => {
    mockedGetAuthProfile.mockRejectedValue(new Error("network error"));
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useAuthProfile("user-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.authProfile).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
