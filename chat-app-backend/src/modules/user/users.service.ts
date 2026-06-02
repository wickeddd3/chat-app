import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { UsersRepository } from "./users.repository";
import type { User } from "@/prisma/client";
import type { SuggestedUser } from "./users.types";
import {
  getSuggestedUserIdsFromContacts,
  sortSuggestedUsersByMutualConnections,
  transformUsersIntoSuggestedUsers,
} from "./users.utils";
import { HttpException } from "@/utils/http.exception";

@injectable()
export class UsersService {
  constructor(@inject(TYPES.UsersRepository) private usersRepository: UsersRepository) {}

  public async getSuggestedUsers({
    authUserId,
    limit = 20,
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    query?: string;
  }): Promise<SuggestedUser[]> {
    try {
      const isInitialLoad = !query;
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
      const users = await this.usersRepository.search({ userId: authUserId, limit, query });

      // 3. Transform and Enrich with Status Flag State Data
      let suggestedUsers: SuggestedUser[] = transformUsersIntoSuggestedUsers({
        users,
        authUserId,
        isInitialLoad,
        suggestedUserIds,
      });

      // 4. Sort local payload if suggested IDs list exists
      if (isInitialLoad && suggestedUserIds.length > 0) {
        suggestedUsers = sortSuggestedUsersByMutualConnections(suggestedUsers, suggestedUserIds);
      }

      return suggestedUsers;
    } catch {
      throw new HttpException(500, "Failed to retrieve suggested users.");
    }
  }

  public async getUserByUsername(username: string): Promise<Partial<User> | null> {
    try {
      return await this.usersRepository.getByUsername(username);
    } catch {
      throw new HttpException(500, "Failed to retrieve user.");
    }
  }
}
