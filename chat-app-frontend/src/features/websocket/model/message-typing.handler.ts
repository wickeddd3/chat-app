import type { QueryClient } from "@tanstack/react-query";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface TypingStatusPayload {
  channelId: string;
  userId: string;
  isTyping: boolean;
}

/**
 * How long a "start" signal keeps someone in the roster without a refresh.
 * A typist re-announces every 2s while active, so this only fires when their
 * "stop" never arrived — a closed tab, a dropped socket, a lost packet.
 */
export const TYPING_TTL_MS = 5000;

/** Pending expiries, keyed by `${channelId}:${userId}` so each typist has one. */
const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

const timerKey = (channelId: string, userId: string) =>
  `${channelId}:${userId}`;

const clearExpiry = (key: string) => {
  const timer = expiryTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    expiryTimers.delete(key);
  }
};

const writeRoster = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  channelId: string,
  update: (current: string[]) => string[],
) => {
  queryClient.setQueryData(
    queryKeys.messages.typing(channelId),
    (current: string[] | undefined) => update(current ?? []),
  );
};

const removeTypist = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  channelId: string,
  userId: string,
) => {
  writeRoster(queryClient, queryKeys, channelId, (current) =>
    current.filter((id) => id !== userId),
  );
};

export const handleTypingStatus = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: TypingStatusPayload,
) => {
  const { channelId, userId, isTyping } = payload;
  const key = timerKey(channelId, userId);

  clearExpiry(key);

  if (!isTyping) {
    removeTypist(queryClient, queryKeys, channelId, userId);
    return;
  }

  writeRoster(queryClient, queryKeys, channelId, (current) =>
    current.includes(userId) ? current : [...current, userId],
  );

  // Failsafe eviction: without it a missing "stop" would pin the indicator on
  // screen forever.
  expiryTimers.set(
    key,
    setTimeout(() => {
      expiryTimers.delete(key);
      removeTypist(queryClient, queryKeys, channelId, userId);
    }, TYPING_TTL_MS),
  );
};

/** Drops every pending expiry — for teardown and test isolation. */
export const resetTypingExpiries = () => {
  expiryTimers.forEach((timer) => clearTimeout(timer));
  expiryTimers.clear();
};
