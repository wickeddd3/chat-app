import type { User } from "@/prisma/client";
import { UsersRepository } from "./users.repository";
import { PaginatedUsers } from "./users.types";

export class UsersService {
  private usersRepository = new UsersRepository();

  public async getAllUsers(authUserId: string, limit: number = 20, cursor?: string): Promise<PaginatedUsers> {
    try {
      return await this.usersRepository.list(authUserId, limit, cursor);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve users");
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
