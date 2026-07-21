/** Inbox tab filters. `all` is the default, unfiltered list. */
export type InboxFilter = "all" | "unread" | "groups";

/** Notification tab filters. `all` is the default, unfiltered list. */
export type NotificationFilter = "all" | "unread";

export const createQueryKeys = (authId: string | undefined) => {
  // If the user isn't authenticated yet, we use a fallback string
  // to ensure keys don't accidentally merge or break arrays
  const scope = authId ?? "anonymous";

  return {
    presence: {
      matrix: (channelId?: string) =>
        [scope, "presence", "matrix", channelId ?? "global"] as const,
    },
    auth: {
      profile: () => [scope, "auth", "profile"] as const,
    },
    dashboard: {
      badges: () => [scope, "dashboard", "badges"] as const,
    },
    channel: {
      details: (channelId: string) =>
        [scope, "channel", "details", channelId] as const,
    },
    inbox: {
      list: (query: string, filter: InboxFilter = "all") =>
        [scope, "inbox", "list", query, filter] as const,
    },
    messages: {
      timeline: (channelId: string) =>
        [scope, "messages", "timeline", channelId] as const,
      // Ephemeral "who is typing" roster — never fetched, only patched by the
      // socket handler, so it lives in the cache purely as a shared store.
      typing: (channelId: string) =>
        [scope, "messages", "typing", channelId] as const,
    },
    connections: {
      sent: () => [scope, "connections", "sent"] as const,
      received: () => [scope, "connections", "received"] as const,
      contacts: (query: string) =>
        [scope, "connections", "contacts", query] as const,
    },
    users: {
      recommended: (query: string) =>
        [scope, "users", "recommended", query] as const,
    },
    notifications: {
      list: (filter: NotificationFilter = "all") =>
        [scope, "notifications", "list", filter] as const,
    },
  };
};

// Infer the type of the factory function itself
export type QueryKeyFactory = typeof createQueryKeys;

// Infer the exact object structure returned by the factory
export type ScopedQueryKeys = ReturnType<QueryKeyFactory>;
