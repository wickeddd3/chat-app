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
    });

    expect(queryClient.getQueryData(queryKeys.presence.matrix())).toEqual({
      "user-1": "online",
    });
  });

  it("merges into an existing presence map without dropping other users", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.presence.matrix(), {
      "user-1": "online",
      "user-2": "offline",
    });

    handleStatusChange(queryClient, queryKeys, {
      userId: "user-2",
      status: "online",
    });

    expect(queryClient.getQueryData(queryKeys.presence.matrix())).toEqual({
      "user-1": "online",
      "user-2": "online",
    });
  });
});
