import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { AuthRepository } from "./auth.repository";
import type { User } from "@/prisma/client";
import { HttpException } from "@/utils/http.exception";
import type { UserAttributes } from "@supabase/supabase-js";

@injectable()
export class AuthService {
  constructor(@inject(TYPES.AuthRepository) private authRepository: AuthRepository) {}

  public async createUser(data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }): Promise<User | null> {
    try {
      return await this.authRepository.create(data);
    } catch {
      throw new HttpException(500, "Failed to create user.");
    }
  }

  public async getUserById(authId: string): Promise<User | null> {
    try {
      return await this.authRepository.getById(authId);
    } catch {
      throw new HttpException(500, "Failed to retrieve auth user.");
    }
  }

  public async updateUserProfile(authId: string, data: { name: string; username: string }): Promise<User | null> {
    try {
      return await this.authRepository.updateProfile(authId, data);
    } catch {
      throw new HttpException(500, "Failed to update user profile.");
    }
  }

  public async updateUserEmail(authId: string, data: { email: string }): Promise<User | null> {
    try {
      return await this.authRepository.updateEmail(authId, data);
    } catch {
      throw new HttpException(500, "Failed to update user email.");
    }
  }

  public async updateUserImage(authId: string, data: { image: string }): Promise<User | null> {
    try {
      return await this.authRepository.updateImage(authId, data);
    } catch {
      throw new HttpException(500, "Failed to update user image.");
    }
  }

  public async updateUserPassword(data: {
    newPassword: string;
    currentPassword: string;
  }): Promise<UserAttributes | null> {
    try {
      return await this.authRepository.updatePassword(data);
    } catch {
      throw new HttpException(500, "Failed to update user password.");
    }
  }
}
