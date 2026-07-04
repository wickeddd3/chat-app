import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { PrismaClient, User } from "@/prisma/client";
import { HttpException } from "@/utils/http.exception";
import { supabase } from "@/lib/supabase";
import type { ProfileSchemaType, SignUpSchemaType } from "./auth.schema";

@injectable()
export class AuthRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public async create(data: SignUpSchemaType): Promise<User | null> {
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
    } catch (error) {
      throw new HttpException(500, "Failed to retrieve auth user.", null, { cause: error });
    }
  }

  public async updateProfile(authId: string, data: ProfileSchemaType): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: authId },
        data,
      });
    } catch (error) {
      throw new HttpException(500, "Failed to update user profile.", null, { cause: error });
    }
  }

  public async updateImage(authId: string, data: { image: string }): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: authId },
        data,
      });
    } catch (error) {
      throw new HttpException(500, "Failed to update user image.", null, { cause: error });
    }
  }
}
