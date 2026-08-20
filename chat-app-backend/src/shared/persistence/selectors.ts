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

/**
 * The quoted message carried on a reply.
 *
 * A snapshot rather than a reference: the parent is usually far enough up the
 * timeline to be unloaded, and the client renders the quote inline, so shipping
 * it with the reply saves a fetch per bubble. It is deliberately shallow — a
 * reply to a reply quotes only its own parent, never the whole chain.
 */
export const MESSAGE_PARENT_SELECT = {
  id: true,
  content: true,
  type: true,
  // Carried so a reply to a photo can show a thumbnail of it — a quote whose
  // content is empty would otherwise render as a blank rail.
  imageUrl: true,
  author: { select: MESSAGE_AUTHOR_SELECT },
} as const;
