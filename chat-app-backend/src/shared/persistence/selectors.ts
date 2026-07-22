/**
 * Shared Prisma `select` projections.
 *
 * These shapes are part of the API contract (they are what the client renders),
 * so they are declared once rather than re-spelled at each `include` site — a
 * field added here reaches every endpoint that projects a user.
 */

/** The public profile shape embedded in contacts, connection requests and rosters. */
export const USER_PROFILE_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const;

/** The narrower author shape carried on a message (no username needed). */
export const MESSAGE_AUTHOR_SELECT = {
  id: true,
  name: true,
  image: true,
} as const;
