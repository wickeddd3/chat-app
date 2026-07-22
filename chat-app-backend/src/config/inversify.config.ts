import "reflect-metadata";
import { Container } from "inversify";

import { infrastructureModule } from "./modules/infrastructure.container";
import { realtimeModule } from "./modules/realtime.container";
import { subscribersModule } from "./modules/subscribers.container";

import { authModule } from "@/modules/auth/auth.container";
import { usersModule } from "@/modules/user/users.container";
import { channelsModule } from "@/modules/channel/channels.container";
import { messagesModule } from "@/modules/message/messages.container";
import { connectionsModule } from "@/modules/connection/connections.container";
import { notificationsModule } from "@/modules/notification/notifications.container";
import { presenceModule } from "@/modules/presence/presence.container";
import { statsModule } from "@/modules/stats/stats.container";

/**
 * Central DI composition root. Each domain owns its own ContainerModule
 * (`<name>.container.ts`); this file just composes them. To add a module,
 * create its container module + add its symbol to types.ts, then load it here.
 */
const container = new Container();

container.load(
  // Cross-cutting infrastructure + real-time + event subscribers.
  infrastructureModule,
  realtimeModule,
  subscribersModule,
  // Domain modules.
  authModule,
  usersModule,
  channelsModule,
  messagesModule,
  connectionsModule,
  notificationsModule,
  presenceModule,
  statsModule,
);

export { container };
