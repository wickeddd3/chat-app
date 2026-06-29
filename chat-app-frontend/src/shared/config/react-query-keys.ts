export const createQueryKeys = (authId: string | undefined) => {
  // If the user isn't authenticated yet, we use a fallback string
  // to ensure keys don't accidentally merge or break arrays
  const scope = authId ?? "anonymous";

  return {
    presence: {
      matrix: (channelId?: string) =>
        [scope, "presence", "matrix", channelId ?? "global"] as const,
    },
    authProfile: {
      details: () => [scope, "authProfile", "details"] as const,
    },
    dashboard: {
      badges: () => [scope, "dashboard", "badges"] as const,
    },
    inbox: {
      list: (query: string) => [scope, "inbox", "list", query] as const,
    },
    messages: {
      timeline: (channelId: string) =>
        [scope, "messages", "timeline", channelId] as const,
    },
    sentRequests: {
      list: () => [scope, "sentRequests", "list"] as const,
    },
    receivedRequests: {
      list: () => [scope, "receivedRequests", "list"] as const,
    },
    contacts: {
      list: (query: string) => [scope, "contacts", "list", query] as const,
    },
    users: {
      recommended: (query: string) =>
        [scope, "users", "recommended", query] as const,
    },
    notifications: {
      list: () => [scope, "notifications", "list"] as const,
    },
  };
};

// Infer the type of the factory function itself
export type QueryKeyFactory = typeof createQueryKeys;

// Infer the exact object structure returned by the factory
export type ScopedQueryKeys = ReturnType<QueryKeyFactory>;
