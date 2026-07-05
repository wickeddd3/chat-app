import { faker } from "@faker-js/faker";
import chatLines from "../data/messages.json";

/** Picks a random casual chat line from the JSON pool. */
export function randomMessage(): string {
  return faker.helpers.arrayElement(chatLines);
}

/** Returns a random avatar image URL for a seeded profile. */
export function randomAvatar(): string {
  return faker.image.avatar();
}

/** Generates a fresh UUID for a client-side-generated primary key. */
export function uuid(): string {
  return faker.string.uuid();
}

/** Returns a plausible full name for a filler (profile-only) account. */
export function randomFullName(): string {
  return faker.person.fullName();
}

/** Returns a random integer in [min, max] (inclusive) for message counts, gaps, etc. */
export function randomInt(min: number, max: number): number {
  return faker.number.int({ min, max });
}

/** Picks a random element from a non-empty array. */
export function pick<T>(items: T[]): T {
  return faker.helpers.arrayElement(items);
}
