import { inject, injectable } from "inversify";
import { TYPES } from "@/config/types";
import { PrismaClient, Prisma } from "@/prisma/client";

/**
 * The client a repository method writes through.
 *
 * `Prisma.TransactionClient` is `PrismaClient` minus the operations that are
 * illegal inside a transaction, so a plain `PrismaClient` is assignable to it.
 * Repository methods therefore take a single optional `executor` and work both
 * standalone and enlisted in a caller's transaction.
 */
export type Executor = Prisma.TransactionClient;

/**
 * Unit of Work: lets a *service* span one transaction across several
 * repositories.
 *
 * Without this, the only way to write two tables atomically was for one
 * repository to reach into the other's table — which is how `ConnectionsRepository`
 * ended up owning `notification` writes alongside `NotificationsRepository`. Now
 * the service opens the transaction and each repository still owns its own table.
 */
@injectable()
export class TransactionManager {
  constructor(@inject(TYPES.PrismaClient) private db: PrismaClient) {}

  public run<T>(work: (tx: Executor) => Promise<T>): Promise<T> {
    return this.db.$transaction(work);
  }
}
