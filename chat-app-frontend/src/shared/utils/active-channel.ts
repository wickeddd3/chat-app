/**
 * Tracks the channel the user is currently viewing (the mounted chat room).
 *
 * Lives as module state rather than React context because the socket event
 * handlers (`SocketOrchestrator`) run outside the routed component tree and need
 * to know, synchronously, whether an incoming message belongs to the channel the
 * user is looking at — so it can be auto-marked read instead of bumping unread.
 */
let activeChannelId: string | null = null;

export function setActiveChannel(channelId: string | null): void {
  activeChannelId = channelId;
}

export function getActiveChannel(): string | null {
  return activeChannelId;
}
