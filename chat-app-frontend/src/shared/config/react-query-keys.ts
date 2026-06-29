export const createQueryKeys = (authId: string | undefined) => {
  // If the user isn't authenticated yet, we use a fallback string
  // to ensure keys don't accidentally merge or break arrays
  const scope = authId ?? "anonymous";

  return {
    presence: {
      matrix: (channelId?: string) => [
        scope,
        "presence",
        "matrix",
        channelId ?? "global",
      ],
    },
    authProfile: {
      details: () => [scope, "authProfile", "details"],
    },
    dashboard: {
      badges: () => [scope, "dashboard", "badges"],
    },
    inbox: {
      list: (query: string) => [scope, "inbox", "list", query],
    },
    messages: {
      timeline: (channelId: string) => [
        scope,
        "messages",
        "timeline",
        channelId,
      ],
    },
    sentRequests: {
      list: () => [scope, "sentRequests", "list"],
    },
    receivedRequests: {
      list: () => [scope, "receivedRequests", "list"],
    },
    contacts: {
      list: (query: string) => [scope, "contacts", "list", query],
    },
    users: {
      recommended: (query: string) => [scope, "users", "recommended", query],
    },
    notifications: {
      list: () => [scope, "notifications", "list"] as const,
    },
  };
};
