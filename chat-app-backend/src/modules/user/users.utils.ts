import type { Connection } from "@/prisma/client";
import { SuggestedUser, UserWithConnections } from "./users.types";

export function getSuggestedUserIdsFromContacts({
  contacts,
  directContactIds,
  userId,
}: {
  contacts: Connection[];
  directContactIds: string[];
  userId: string;
}): string[] {
  const mutualCounts: Record<string, number> = {};

  const directFriendsSet = new Set<string>(directContactIds);

  contacts.forEach((c) => {
    const potentialId1 = c.senderId;
    const potentialId2 = c.receiverId;

    // Increment count if it's a friend-of-a-friend and not me or my direct friend
    if (!directFriendsSet.has(potentialId1) && potentialId1 !== userId) {
      mutualCounts[potentialId1] = (mutualCounts[potentialId1] || 0) + 1;
    }
    if (!directFriendsSet.has(potentialId2) && potentialId2 !== userId) {
      mutualCounts[potentialId2] = (mutualCounts[potentialId2] || 0) + 1;
    }
  });

  const suggestedUserIds = Object.keys(mutualCounts).sort((a, b) => (mutualCounts[b] ?? 0) - (mutualCounts[a] ?? 0));

  return suggestedUserIds;
}

export function transformUsersIntoSuggestedUsers({
  users,
  authUserId,
  isInitialLoad,
  suggestedUserIds,
}: {
  users: UserWithConnections[];
  authUserId: string;
  isInitialLoad: boolean;
  suggestedUserIds: string[];
}): SuggestedUser[] {
  const mappedUsers: SuggestedUser[] = users.map((user) => {
    let connectionStatus: SuggestedUser["connectionStatus"] = "STRANGER";

    // Evaluate intersection vectors across inbound/outbound records
    const outbound = user.receivedConnections?.find((c) => c.senderId === authUserId);
    const inbound = user.sentConnections?.find((c) => c.receiverId === authUserId);
    const combined = outbound || inbound;

    if (combined) {
      if (combined.status === "ACCEPTED") {
        connectionStatus = "CONTACT";
      } else if (outbound && outbound.status === "PENDING") {
        connectionStatus = "PENDING_SENT";
      } else if (inbound && inbound.status === "PENDING") {
        connectionStatus = "PENDING_RECEIVED";
      }
    }

    // Calculate mutual score count match for the specific target user mapping
    const mutualCount = isInitialLoad
      ? suggestedUserIds.indexOf(user.id) !== -1
        ? suggestedUserIds.indexOf(user.id) + 1
        : 0
      : 0;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      connectionStatus,
      mutualConnectionsCount: mutualCount,
    };
  });

  return mappedUsers;
}

export function sortSuggestedUsersByMutualConnections(
  suggestedUsers: SuggestedUser[],
  suggestedUserIds: string[],
): SuggestedUser[] {
  return suggestedUsers.sort((a, b) => {
    const aIndex = suggestedUserIds.indexOf(a.id);
    const bIndex = suggestedUserIds.indexOf(b.id);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}
