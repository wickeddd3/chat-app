import type { OpenAPIV3 } from "openapi-types";
import { authPaths, authSchemas } from "./auth/auth.docs";
import { channelsPaths, channelsSchemas } from "./channel/channels.docs";
import { connectionsPaths, connectionsSchemas } from "./connection/connections.docs";
import { messagesPaths, messagesSchemas } from "./message/messages.docs";
import { notificationsPaths, notificationsSchemas } from "./notification/notifications.docs";
import { usersPaths, usersSchemas } from "./user/users.docs";
import { statsPaths } from "./stats/stats.docs";

export const combinedPaths: OpenAPIV3.PathsObject = {
  ...authPaths,
  ...channelsPaths,
  ...connectionsPaths,
  ...messagesPaths,
  ...notificationsPaths,
  ...usersPaths,
  ...statsPaths,
};

export const combinedSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ...authSchemas,
  ...channelsSchemas,
  ...connectionsSchemas,
  ...messagesSchemas,
  ...notificationsSchemas,
  ...usersSchemas,
};
