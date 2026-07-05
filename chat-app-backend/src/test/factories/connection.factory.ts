import type { Connection } from "@/prisma/client";
import type { ConnectionStatus } from "@/prisma/enums";
import { prisma } from "@/test/helpers/db.helper";

export interface ConnectionOverrides {
  senderId: string;
  receiverId: string;
  status?: ConnectionStatus;
  createdAt?: Date;
}

/** Inserts a Connection row (defaults to PENDING). */
export async function createConnection(overrides: ConnectionOverrides): Promise<Connection> {
  return prisma.connection.create({
    data: {
      senderId: overrides.senderId,
      receiverId: overrides.receiverId,
      status: overrides.status ?? "PENDING",
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
    },
  });
}
