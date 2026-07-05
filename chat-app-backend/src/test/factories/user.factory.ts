import { randomUUID } from "crypto";
import type { User } from "@/prisma/client";
import { prisma } from "@/test/helpers/db.helper";

export interface UserOverrides {
  id?: string;
  name?: string;
  username?: string;
  image?: string | null;
}

/** Builds a valid User create input (unique id + username by default). */
export function buildUser(overrides: UserOverrides = {}): { id: string; name: string; username: string } {
  return {
    id: overrides.id ?? randomUUID(),
    name: overrides.name ?? `User ${randomUUID().slice(0, 8)}`,
    // Usernames are unique — a UUID guarantees no collision across tests.
    username: overrides.username ?? randomUUID(),
  };
}

/** Inserts a User and returns the row. */
export async function createUser(overrides: UserOverrides = {}): Promise<User> {
  return prisma.user.create({
    data: { ...buildUser(overrides), ...(overrides.image !== undefined && { image: overrides.image }) },
  });
}

/** Inserts `count` users and returns them. */
export async function createUsers(count: number): Promise<User[]> {
  const users: User[] = [];
  for (let i = 0; i < count; i++) users.push(await createUser());
  return users;
}
