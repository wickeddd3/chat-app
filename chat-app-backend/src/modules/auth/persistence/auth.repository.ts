import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { PrismaClient, User } from "@/prisma/client";
import { withPersistence } from "@/shared/persistence/prisma-error.mapper";
import type { Executor } from "@/shared/persistence/transaction";
import type { ProfileSchemaType } from "../auth.schema";

/**
 * The identity slice of the `user` table: the authenticated user's own profile
 * row. This module is its single writer (rows are created at sign-up and edited
 * here); the user module only reads the table for discovery.
 *
 * Pure persistence — the Supabase sign-up and its compensation are orchestrated
 * by the service, so this class just writes the row it's given.
 */
@injectable()
export class AuthRepository {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  private client(executor?: Executor): Executor {
    return executor ?? this.db;
  }

  /** Creates the profile row for an already-provisioned Supabase account (shared id). */
  public async create(
    { id, name, username }: { id: string; name: string; username: string },
    executor?: Executor,
  ): Promise<User> {
    return withPersistence("Failed to create user profile.", () =>
      this.client(executor).user.create({ data: { id, name, username } }),
    );
  }

  public async getById(authId: string, executor?: Executor): Promise<User | null> {
    return withPersistence("Failed to retrieve auth user.", () =>
      this.client(executor).user.findUnique({ where: { id: authId } }),
    );
  }

  public async updateProfile(authId: string, data: ProfileSchemaType, executor?: Executor): Promise<User> {
    return withPersistence("Failed to update user profile.", () =>
      this.client(executor).user.update({ where: { id: authId }, data }),
    );
  }

  public async updateImage(authId: string, data: { image: string | null }, executor?: Executor): Promise<User> {
    return withPersistence("Failed to update user image.", () =>
      this.client(executor).user.update({ where: { id: authId }, data }),
    );
  }

  /**
   * Durably records when users were last seen (the presence-activity slice of the
   * `user` table). Called by the presence prune worker when heartbeat leases lapse,
   * so last-seen survives a Redis flush. Batched — one write per sweep — and a no-op
   * for an empty batch.
   */
  public async updateLastSeen(userIds: string[], lastSeen: Date, executor?: Executor): Promise<void> {
    if (userIds.length === 0) return;
    await withPersistence("Failed to update last seen.", () =>
      this.client(executor).user.updateMany({ where: { id: { in: userIds } }, data: { lastSeen } }),
    );
  }
}
