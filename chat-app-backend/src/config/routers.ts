import { TYPES } from "./types";

/**
 * Every HTTP router mounted under `/api`, in the order they're registered.
 *
 * Kept apart from the bootstrap so the docs drift test can resolve the same
 * list without starting the server — a router added here is then checked for
 * documentation automatically, rather than being noticed once someone opens
 * `/api-docs` and finds the endpoint missing.
 */
export const ROUTER_TYPES = [
  TYPES.AuthRouter,
  TYPES.UsersRouter,
  TYPES.ChannelsRouter,
  TYPES.MessagesRouter,
  TYPES.ConnectionsRouter,
  TYPES.NotificationsRouter,
  TYPES.PresenceRouter,
  TYPES.StatsRouter,
] as const;
