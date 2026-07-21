import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { Server as SocketServer } from "socket.io";

import { SocketServerProvider } from "@/web-socket/socket-server.provider";
import { WebSocketServer } from "@/web-socket/web-socket.server";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { SendMessageCommand } from "@/web-socket/commands/send-message.command";
import { ReadMessageCommand } from "@/web-socket/commands/read-message.command";
import { JoinChannelCommand } from "@/web-socket/commands/join-channel.command";
import { LeaveChannelCommand } from "@/web-socket/commands/leave-channel.command";
import { DisconnectCommand } from "@/web-socket/commands/disconnect.command";
import { HeartbeatCommand } from "@/web-socket/commands/heartbeat.command";
import { TypingCommand } from "@/web-socket/commands/typing.command";

import { PresenceService } from "@/services/presence.service";
import { PresencePruneWorker } from "@/services/presence-prune.worker";
import { BroadcasterService } from "@/services/broadcaster.service";

/**
 * Real-time layer: the Socket.io server provider + server token, the broadcast
 * fan-out and presence services, and the multi-injected websocket command
 * registry (strategy pattern). Adding a new socket event = add a command class
 * and register it here.
 */
export const realtimeModule = new ContainerModule(({ bind }) => {
  bind<SocketServerProvider>(TYPES.SocketServerProvider).to(SocketServerProvider).inSingletonScope();
  bind<PresenceService>(TYPES.PresenceService).to(PresenceService).inSingletonScope();
  bind<PresencePruneWorker>(TYPES.PresencePruneWorker).to(PresencePruneWorker).inSingletonScope();
  bind<BroadcasterService>(TYPES.BroadcasterService).to(BroadcasterService);
  bind<WebSocketServer>(TYPES.WebSocketServer).to(WebSocketServer);

  // Resolve the live SocketServer token via the provider's singleton instance.
  bind<SocketServer>(TYPES.SocketServer).toDynamicValue((context) =>
    context.get<SocketServerProvider>(TYPES.SocketServerProvider).getInstance(),
  );

  // Multi-bind strategy event commands (see WebSocketServer command registry).
  bind<WebSocketCommand>(TYPES.WebSocketCommand).to(SendMessageCommand);
  bind<WebSocketCommand>(TYPES.WebSocketCommand).to(ReadMessageCommand);
  bind<WebSocketCommand>(TYPES.WebSocketCommand).to(JoinChannelCommand);
  bind<WebSocketCommand>(TYPES.WebSocketCommand).to(LeaveChannelCommand);
  bind<WebSocketCommand>(TYPES.WebSocketCommand).to(DisconnectCommand);
  bind<WebSocketCommand>(TYPES.WebSocketCommand).to(HeartbeatCommand);
  bind<WebSocketCommand>(TYPES.WebSocketCommand).to(TypingCommand);
});
