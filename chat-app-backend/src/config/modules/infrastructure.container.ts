import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";

import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/prisma/client";
import { pubClient, redisClient, subClient } from "@/lib/redis";
import type { Redis } from "ioredis";
import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eventDispatcher } from "@/lib/event-dispatcher";
import { TransactionManager } from "@/shared/persistence/transaction";

/**
 * Cross-cutting infrastructure singletons (constant values wired up outside the
 * container): Prisma client, the three Redis connections, and the domain-event
 * dispatcher. Everything here is a pre-constructed instance, bound as a constant.
 */
export const infrastructureModule = new ContainerModule(({ bind }) => {
  bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
  bind<SupabaseClient>(TYPES.SupabaseClient).toConstantValue(supabase);
  bind(TYPES.EventDispatcher).toConstantValue(eventDispatcher);
  // Resolved from the container (not pre-constructed) so it picks up the bound
  // Prisma client — including the test client in integration runs.
  bind<TransactionManager>(TYPES.TransactionManager).to(TransactionManager);

  // Main operational caching engine / presence tracking.
  bind<Redis>(TYPES.RedisMainClient).toConstantValue(redisClient);
  // High-performance outward cluster event pipeline (MessagePack bus).
  bind<Redis>(TYPES.RedisPubClient).toConstantValue(pubClient);
  // Isolated inbound adapter sync listener (Socket.io horizontal scaling).
  bind<Redis>(TYPES.RedisSubClient).toConstantValue(subClient);
});
