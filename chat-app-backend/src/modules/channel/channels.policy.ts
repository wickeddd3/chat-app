import type { ChannelType } from "@/prisma/enums";
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors/domain.error";

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

/**
 * Leaving applies to groups only, and only to a channel you are actually in.
 *
 * A direct channel has no "leave": it is dissolved by removing the contact,
 * which keeps the history readable for both sides. Rejecting it here rather than
 * silently deleting a membership row keeps the two flows from blurring together.
 */
export function assertCanLeaveGroup(
  channel: { type: ChannelType } | null,
  isMember: boolean,
): asserts channel is { type: ChannelType } {
  if (!channel) {
    throw new NotFoundError("Channel not found.");
  }
  if (channel.type !== "GROUP") {
    throw new ValidationError("You can only leave a group channel.");
  }
  if (!isMember) {
    throw new ForbiddenError("You are not a member of this channel.");
  }
}
