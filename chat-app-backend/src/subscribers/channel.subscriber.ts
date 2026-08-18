import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { LeaveChannelResult } from "@/modules/channel/channels.types";
import { BroadcasterService } from "@/services/broadcaster.service";

interface MemberLeftEvent extends LeaveChannelResult {
  leaverId: string;
}

@injectable()
export class ChannelSubscriber {
  constructor(@inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService) {
    this.handleMemberLeft = this.handleMemberLeft.bind(this);
  }

  /**
   * Tells the members who stayed that someone left, carrying the system message
   * so their open chat room can append it without a refetch.
   *
   * Only the remaining members are notified — the leaver's own mutation already
   * dropped the channel from their caches, and when the channel was deleted
   * (last one out) there is nobody left to tell.
   */
  public handleMemberLeft = async ({
    channelId,
    leaverId,
    remainingMemberIds,
    promotedAdminId,
    systemMessage,
  }: MemberLeftEvent): Promise<void> => {
    await Promise.all(
      remainingMemberIds.map((memberId) =>
        this.broadcaster.emitToUser(memberId, "channel:member_left", {
          channelId,
          userId: leaverId,
          promotedAdminId,
          systemMessage,
        }),
      ),
    );
  };
}
