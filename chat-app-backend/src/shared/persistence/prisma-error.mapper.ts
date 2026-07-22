import { Prisma } from "@/prisma/client";
import { ConflictError, DomainError, NotFoundError, PersistenceError } from "@/shared/errors/domain.error";

/**
 * Translates a driver-level failure into the domain vocabulary.
 *
 * Repositories wrap their Prisma calls with this so a unique-constraint violation
 * surfaces as a 409 and a missing row as a 404, instead of every failure becoming
 * an indistinguishable 500. Anything we don't model stays a `PersistenceError`
 * (→ 500) with the original error preserved as `cause`.
 */
export function toDomainError(error: unknown, fallbackMessage: string): DomainError {
  // A domain error thrown inside the wrapped block (e.g. by a policy check
  // running in a transaction) passes through untouched.
  if (error instanceof DomainError) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return new ConflictError("That record already exists.", null, { cause: error });
      case "P2025":
        return new NotFoundError("The requested record no longer exists.", null, { cause: error });
      case "P2003":
        return new ConflictError("That record is still referenced by another.", null, { cause: error });
      default:
        break;
    }
  }

  return new PersistenceError(fallbackMessage, null, { cause: error });
}

/**
 * Runs a persistence operation, normalising any failure to a `DomainError`.
 *
 * Replaces the per-method `try { … } catch { throw new HttpException(500, …) }`
 * blocks: one call, and the error keeps its meaning on the way up.
 */
export async function withPersistence<T>(fallbackMessage: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toDomainError(error, fallbackMessage);
  }
}
