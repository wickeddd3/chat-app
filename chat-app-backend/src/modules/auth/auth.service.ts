import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { SupabaseClient, AuthError } from "@supabase/supabase-js";
import type { User } from "@/prisma/client";
import { AuthRepository } from "./persistence/auth.repository";
import type { ProfileSchemaType, SignUpSchemaType } from "./auth.schema";
import { ConflictError, DomainError, PersistenceError, ValidationError } from "@/shared/errors/domain.error";
import { createLogger } from "@/lib/logger";

const log = createLogger("Auth");

/** Translates a Supabase sign-up failure into the domain vocabulary. */
function toSignUpError(error: AuthError): DomainError {
  const message = error.message || "Sign up failed.";
  // A duplicate account is the dominant, user-meaningful failure.
  if (/registered|already|exists/i.test(message)) {
    return new ConflictError(message, null, { cause: error });
  }
  // Other client-side rejections (weak password, invalid email) are validation.
  if (typeof error.status === "number" && error.status >= 400 && error.status < 500) {
    return new ValidationError(message, null, { cause: error });
  }
  return new PersistenceError("Auth processing failure.", null, { cause: error });
}

/**
 * Identity + own-profile management. Sign-up spans two systems — the Supabase
 * auth provider and our `user` table — so it is orchestrated here (not in the
 * repository), including the compensation that rolls back the Supabase account
 * if the profile row can't be written.
 */
@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.AuthRepository) private authRepository: AuthRepository,
    @inject(TYPES.SupabaseClient) private supabase: SupabaseClient,
  ) {}

  public async createUser(data: SignUpSchemaType): Promise<User> {
    const { name, username, email, password } = data;

    // 1. Provision the credentials in Supabase Auth.
    const { data: authData, error: authError } = await this.supabase.auth.signUp({ email, password });
    if (authError) throw toSignUpError(authError);
    if (!authData.user) throw new PersistenceError("Auth processing failure: no account was created.");

    const supabaseUserId = authData.user.id;

    // 2. Mirror it into our user table, sharing the Supabase id. If this fails,
    //    roll back the orphaned auth account so the sign-up can be retried.
    try {
      return await this.authRepository.create({ id: supabaseUserId, name, username: username.toLowerCase() });
    } catch (error) {
      await this.supabase.auth.admin.deleteUser(supabaseUserId).catch((cleanupError: unknown) => {
        log.error({ err: cleanupError, supabaseUserId }, "Failed to roll back orphaned Supabase account");
      });
      throw error;
    }
  }

  public async getUserById(authId: string): Promise<User | null> {
    return this.authRepository.getById(authId);
  }

  public async updateUserProfile(authId: string, data: ProfileSchemaType): Promise<User> {
    return this.authRepository.updateProfile(authId, data);
  }

  public async updateUserImage(authId: string, data: { image: string | null }): Promise<User> {
    return this.authRepository.updateImage(authId, data);
  }
}
