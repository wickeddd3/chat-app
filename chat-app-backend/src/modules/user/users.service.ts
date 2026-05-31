import type { User } from "@/prisma/client";
import { UsersRepository } from "./users.repository";
import { PaginatedUsers, SuggestedUser } from "./users.types";
import {
  getSuggestedUserIdsFromContacts,
  sortSuggestedUsersByMutualConnections,
  transformUsersIntoSuggestedUsers,
} from "./users.utils";

export class UsersService {
  private usersRepository = new UsersRepository();

  public async getSuggestedUsers({
    authUserId,
    limit = 20,
    cursor = "",
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
  }): Promise<PaginatedUsers> {
    try {
      const isInitialLoad = !cursor && !query;
      let suggestedUserIds: string[] = [];

      // 1. Calculate Mutual Connections for Suggestions on initial load
      if (isInitialLoad) {
        // Find authenticated user's direct contact IDs
        const directContactIds = await this.usersRepository.getContactIds(authUserId);
        if (directContactIds.length > 0) {
          // Find all contact IDs of people my direct contacts are connected with
          const contactsOfContacts = await this.usersRepository.getContactIdsContacts(authUserId, directContactIds);
          // Derive a ranked list of suggested user IDs based on mutual connection counts
          suggestedUserIds = getSuggestedUserIdsFromContacts({
            contacts: contactsOfContacts,
            directContactIds,
            userId: authUserId,
          });
        }
      }

      // 2. Search for users matching query and pagination, excluding self and leveraging connections for status flags
      const users = await this.usersRepository.search({ userId: authUserId, limit, cursor, query });

      // 3. Transform and Enrich with Status Flag State Data
      let mappedUsers: SuggestedUser[] = transformUsersIntoSuggestedUsers({
        users,
        authUserId,
        isInitialLoad,
        suggestedUserIds,
      });

      // 4. Sort local payload if suggested IDs list exists
      if (isInitialLoad && suggestedUserIds.length > 0) {
        mappedUsers = sortSuggestedUsersByMutualConnections(mappedUsers, suggestedUserIds);
      }

      const hasMore = mappedUsers.length === limit;
      const nextCursor = hasMore ? mappedUsers[mappedUsers.length - 1]?.id : null;

      return {
        users: mappedUsers,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve suggested users");
    }
  }

  public async getUserByUsername(username: string): Promise<Partial<User> | null> {
    try {
      return await this.usersRepository.getByUsername(username);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve user");
    }
  }
}
