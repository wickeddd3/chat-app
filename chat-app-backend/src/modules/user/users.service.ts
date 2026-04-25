import type { User } from "@/prisma/client";
import { UsersRepository } from "./users.repository";

export class UsersService {
  private usersRepository = new UsersRepository();

  public async getAllUsers(): Promise<Partial<User[]>> {
    try {
      return await this.usersRepository.list();
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve users");
    }
  }
}
