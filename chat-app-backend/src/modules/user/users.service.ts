import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { UsersQuery } from "./persistence/users.query";
import { ConnectionsQuery } from "@/modules/connection/persistence/connections.query";
import type { SuggestedUser, UserProfile } from "./users.types";
import {
  getSuggestedUserIdsFromContacts,
  sortSuggestedUsersByMutualConnections,
  transformUsersIntoSuggestedUsers,
} from "./users.utils";

/**
 * User discovery. Orchestrates the "people you may know" ranking over the
 * contact graph (owned by the connection module) and the user search (owned
 * here), then lets pure helpers derive status badges and mutual-connection
 * ordering. Domain errors from the queries propagate unchanged.
 */
@injectable()
export class UsersService {
  constructor(
    @inject(TYPES.UsersQuery) private usersQuery: UsersQuery,
    @inject(TYPES.ConnectionsQuery) private connectionsQuery: ConnectionsQuery,
  ) {}

  public async getSuggestedUsers({
    authUserId,
    limit = 20,
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    query?: string;
  }): Promise<SuggestedUser[]> {
    const isInitialLoad = !query;
    let suggestedUserIds: string[] = [];

    // Rank friend-of-a-friend suggestions on the initial (unsearched) load.
    if (isInitialLoad) {
      const directContactIds = await this.connectionsQuery.getContactIds(authUserId);
      if (directContactIds.length > 0) {
        const contactsOfContacts = await this.connectionsQuery.getContactsOfContacts(authUserId, directContactIds);
        suggestedUserIds = getSuggestedUserIdsFromContacts({
          contacts: contactsOfContacts,
          directContactIds,
          userId: authUserId,
        });
      }
    }

    // Candidate users (excluding self), carrying the caller's edges for badges.
    const users = await this.usersQuery.search({ userId: authUserId, limit, query });

    let suggestedUsers = transformUsersIntoSuggestedUsers({ users, authUserId, isInitialLoad, suggestedUserIds });

    if (isInitialLoad && suggestedUserIds.length > 0) {
      suggestedUsers = sortSuggestedUsersByMutualConnections(suggestedUsers, suggestedUserIds);
    }

    return suggestedUsers;
  }

  public async getUserByUsername(username: string): Promise<UserProfile | null> {
    return this.usersQuery.getByUsername(username);
  }
}
