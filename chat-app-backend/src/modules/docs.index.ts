import type { OpenAPIV3 } from "openapi-types";
import { healthPaths } from "@/lib/health.docs";
import { authPaths, authSchemas } from "./auth/auth.docs";
import { channelsPaths, channelsSchemas } from "./channel/channels.docs";
import { connectionsPaths, connectionsSchemas } from "./connection/connections.docs";
import { messagesPaths, messagesSchemas } from "./message/messages.docs";
import { notificationsPaths, notificationsSchemas } from "./notification/notifications.docs";
import { presencePaths, presenceSchemas } from "./presence/presence.docs";
import { usersPaths, usersSchemas } from "./user/users.docs";
import { statsPaths } from "./stats/stats.docs";

export const combinedPaths: OpenAPIV3.PathsObject = {
  ...authPaths,
  ...channelsPaths,
  ...connectionsPaths,
  ...messagesPaths,
  ...notificationsPaths,
  ...presencePaths,
  ...usersPaths,
  ...statsPaths,
  ...healthPaths,
};

export const combinedSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ...authSchemas,
  ...channelsSchemas,
  ...connectionsSchemas,
  ...messagesSchemas,
  ...notificationsSchemas,
  ...presenceSchemas,
  ...usersSchemas,
};
