import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";

import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/prisma/client";
import { redisClient } from "@/lib/redis";
import { eventDispatcher } from "@/lib/event-dispatcher";

import { UsersRepository } from "@/modules/user/users.repository";
import { UsersService } from "@/modules/user/users.service";
import { UsersController } from "@/modules/user/users.controller";

import { ChannelsController } from "@/modules/channel/channels.controller";
import { ChannelsService } from "@/modules/channel/channels.service";
import { ChannelsRepository } from "@/modules/channel/channels.repository";

import { MessagesController } from "@/modules/message/messages.controller";
import { MessagesService } from "@/modules/message/messages.service";
import { MessagesRepository } from "@/modules/message/messages.repository";

import { MessageReceiptsService } from "@/modules/message-receipt/message-receipts.service";
import { MessageReceiptsRepository } from "@/modules/message-receipt/message-receipts.repository";

import { ConnectionsController } from "@/modules/connection/connections.controller";
import { ConnectionsService } from "@/modules/connection/connections.service";
import { ConnectionsRepository } from "@/modules/connection/connections.repository";

import { NotificationsRepository } from "@/modules/notification/notifications.repository";
import { NotificationsService } from "@/modules/notification/notifications.service";
import { NotificationsController } from "@/modules/notification/notifications.controller";

import { Server as SocketServer } from "socket.io";
import { SocketServerProvider } from "@/web-socket/socket-server.provider";
import { WebSocketService } from "@/web-socket/web-socket.service";
import { PresenceService } from "@/web-socket/services/presence.service";

import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { SendMessageCommand } from "@/web-socket/commands/send-message.command";
import { ReadMessageCommand } from "@/web-socket/commands/read-message.command";
import { JoinChannelCommand } from "@/web-socket/commands/join-channel.command";
import { LeaveChannelCommand } from "@/web-socket/commands/leave-channel.command";
import { DisconnectCommand } from "@/web-socket/commands/disconnect.command";
import { HeartbeatCommand } from "@/web-socket/commands/heartbeat.command";

import { NotificationSubscriber } from "@/web-socket/handlers/notification.subscriber";

const container = new Container();

// Bind Prisma Client as a structural constant value singleton
container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind(TYPES.RedisClient).toConstantValue(redisClient);
container.bind(TYPES.EventDispatcher).toConstantValue(eventDispatcher);

// Bind domain layers
container.bind<UsersController>(TYPES.UsersController).to(UsersController);
container.bind<UsersService>(TYPES.UsersService).to(UsersService);
container.bind<UsersRepository>(TYPES.UsersRepository).to(UsersRepository);

container.bind<ChannelsController>(TYPES.ChannelsController).to(ChannelsController);
container.bind<ChannelsService>(TYPES.ChannelsService).to(ChannelsService);
container.bind<ChannelsRepository>(TYPES.ChannelsRepository).to(ChannelsRepository);

container.bind<MessagesController>(TYPES.MessagesController).to(MessagesController);
container.bind<MessagesService>(TYPES.MessagesService).to(MessagesService);
container.bind<MessagesRepository>(TYPES.MessagesRepository).to(MessagesRepository);

container.bind<MessageReceiptsService>(TYPES.MessageReceiptsService).to(MessageReceiptsService);
container.bind<MessageReceiptsRepository>(TYPES.MessageReceiptsRepository).to(MessageReceiptsRepository);

container.bind<ConnectionsController>(TYPES.ConnectionsController).to(ConnectionsController);
container.bind<ConnectionsService>(TYPES.ConnectionsService).to(ConnectionsService);
container.bind<ConnectionsRepository>(TYPES.ConnectionsRepository).to(ConnectionsRepository);

container.bind<NotificationsController>(TYPES.NotificationsController).to(NotificationsController);
container.bind<NotificationsService>(TYPES.NotificationsService).to(NotificationsService);
container.bind<NotificationsRepository>(TYPES.NotificationsRepository).to(NotificationsRepository);

container.bind<SocketServerProvider>(TYPES.SocketServerProvider).to(SocketServerProvider).inSingletonScope();
container.bind<PresenceService>(TYPES.PresenceService).to(PresenceService).inSingletonScope();

// Bind subscriber class handler
container.bind<NotificationSubscriber>(TYPES.NotificationSubscriber).to(NotificationSubscriber).inSingletonScope();

// Bind the actual SocketServer token using a dynamic Inversify Factory Provider resolution lookup
container.bind<SocketServer>(TYPES.SocketServer).toDynamicValue((context) => {
  return context.get<SocketServerProvider>(TYPES.SocketServerProvider).getInstance();
});

// Multi-bind Strategy Event Commands
container.bind<WebSocketCommand>(TYPES.WebSocketCommand).to(SendMessageCommand);
container.bind<WebSocketCommand>(TYPES.WebSocketCommand).to(ReadMessageCommand);
container.bind<WebSocketCommand>(TYPES.WebSocketCommand).to(JoinChannelCommand);
container.bind<WebSocketCommand>(TYPES.WebSocketCommand).to(LeaveChannelCommand);
container.bind<WebSocketCommand>(TYPES.WebSocketCommand).to(DisconnectCommand);
container.bind<WebSocketCommand>(TYPES.WebSocketCommand).to(HeartbeatCommand);

// Bind main service orchestration driver engine
container.bind<WebSocketService>(TYPES.WebSocketService).to(WebSocketService);

export { container };
