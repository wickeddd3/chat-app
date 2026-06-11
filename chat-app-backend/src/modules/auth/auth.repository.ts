import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { PrismaClient, User } from "@/prisma/client";
import { HttpException } from "@/utils/http.exception";
import { supabase } from "@/lib/supabase";
import type { UserAttributes } from "@supabase/supabase-js";

@injectable()
export class AuthRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async create(data: { name: string; username: string; email: string; password: string }): Promise<User | null> {
    const { name, username, email, password } = data;

    let supabaseUserId: string | null = null;

    try {
      // 1. Register the credentials inside Supabase Auth management system
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new HttpException(500, "Auth processing failure");
      }

      // Capture the generated UUID string reference
      supabaseUserId = authData.user.id;

      // 2. Synchronize and populate your internal Prisma application table model
      const newUser = await this.db.user.create({
        data: {
          id: supabaseUserId, // Link directly to Supabase internal registration UUID
          name: name,
          email: email,
          username: username.toLowerCase(),
        },
      });

      return newUser;
    } catch {
      if (supabaseUserId) {
        await supabase.auth.admin.deleteUser(supabaseUserId);
      }

      throw new HttpException(500, "An unexpected error occurred during profile synchronization");
    }
  }

  public async getById(authId: string): Promise<User | null> {
    try {
      return await this.db.user.findUnique({ where: { id: authId } });
    } catch {
      throw new HttpException(500, "Failed to retrieve auth user.");
    }
  }

  public async updateProfile(authId: string, data: { name: string; username: string }): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: authId },
        data,
      });
    } catch {
      throw new HttpException(500, "Failed to update user profile.");
    }
  }

  public async updateEmail(authId: string, data: { email: string }): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: authId },
        data,
      });
    } catch {
      throw new HttpException(500, "Failed to update user email.");
    }
  }

  public async updateImage(authId: string, data: { image: string }): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: authId },
        data,
      });
    } catch {
      throw new HttpException(500, "Failed to update user image.");
    }
  }

  public async updatePassword(data: { newPassword: string; currentPassword: string }): Promise<UserAttributes | null> {
    try {
      return await supabase.auth.updateUser({
        password: data.newPassword,
        current_password: data.currentPassword,
      });
    } catch {
      throw new HttpException(500, "Failed to update user password.");
    }
  }
}
