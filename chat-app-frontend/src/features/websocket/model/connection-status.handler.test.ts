import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { handleStatusChange } from "./connection-status.handler";

describe("handleStatusChange", () => {
  const queryKeys = createQueryKeys("auth-user");

  it("sets the user's status on an empty presence map", () => {
    const queryClient = new QueryClient();

    handleStatusChange(queryClient, queryKeys, {
      userId: "user-1",
      status: "online",
      lastSeen: null,
    });

    expect(queryClient.getQueryData(queryKeys.presence.matrix())).toEqual({
      "user-1": { status: "online", lastSeen: null },
    });
  });

  it("records the last-seen timestamp on an offline delta", () => {
    const queryClient = new QueryClient();

    handleStatusChange(queryClient, queryKeys, {
      userId: "user-1",
      status: "offline",
      lastSeen: "2026-07-23T10:00:00.000Z",
    });

    expect(queryClient.getQueryData(queryKeys.presence.matrix())).toEqual({
      "user-1": { status: "offline", lastSeen: "2026-07-23T10:00:00.000Z" },
    });
  });

  it("merges into an existing presence map without dropping other users", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.presence.matrix(), {
      "user-1": { status: "online", lastSeen: null },
      "user-2": { status: "offline", lastSeen: "2026-07-23T09:00:00.000Z" },
    });

    handleStatusChange(queryClient, queryKeys, {
      userId: "user-2",
      status: "online",
      lastSeen: null,
    });

    expect(queryClient.getQueryData(queryKeys.presence.matrix())).toEqual({
      "user-1": { status: "online", lastSeen: null },
      "user-2": { status: "online", lastSeen: null },
    });
  });
});
