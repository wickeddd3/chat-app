import { ForbiddenError } from "@/shared/errors/domain.error";

/**
 * Channel authorization rules — pure, no I/O.
 *
 * The group-admin check previously lived in two places at once: the controller
 * threw a 403 before calling the service, and the repository re-checked inside
 * its update transaction. Neither is where authorization belongs; it is a single
 * decision the service makes here.
 */

/** Managing a group (rename, membership changes) is admin-only. */
export function assertIsChannelAdmin(isAdmin: boolean): void {
  if (!isAdmin) {
    throw new ForbiddenError("Only group admins can update this channel.");
  }
}
