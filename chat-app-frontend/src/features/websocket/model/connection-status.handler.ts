import type { QueryClient } from "@tanstack/react-query";

// Presence updates handler
export const handleStatusChange = (
  queryClient: QueryClient,
  data: {
    userId: string;
    status: "online" | "offline";
  },
) => {
  queryClient.setQueryData(
    ["presence", "matrix", "global"],
    (oldMap: Record<string, string> | undefined) => {
      return { ...oldMap, [data.userId]: data.status };
    },
  );
};
