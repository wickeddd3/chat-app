import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";

import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/prisma/client";
import { redisClient } from "@/lib/redis";
import { eventDispatcher } from "@/lib/event-dispatcher";

import { AuthRouter } from "@/modules/auth/auth.router";
import { AuthController } from "@/modules/auth/auth.controller";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthRepository } from "@/modules/auth/auth.repository";

import { UsersRouter } from "@/modules/user/users.router";
import { UsersController } from "@/modules/user/users.controller";
import { UsersRepository } from "@/modules/user/users.repository";
import { UsersService } from "@/modules/user/users.service";

import { ChannelsRouter } from "@/modules/channel/channels.router";
import { ChannelsController } from "@/modules/channel/channels.controller";
import { ChannelsService } from "@/modules/channel/channels.service";
import { ChannelsRepository } from "@/modules/channel/channels.repository";

import { MessagesRouter } from "@/modules/message/messages.router";
import { MessagesController } from "@/modules/message/messages.controller";
import { MessagesService } from "@/modules/message/messages.service";
import { MessagesRepository } from "@/modules/message/messages.repository";

import { MessageReceiptsService } from "@/modules/message-receipt/message-receipts.service";
import { MessageReceiptsRepository } from "@/modules/message-receipt/message-receipts.repository";

import { ConnectionsRouter } from "@/modules/connection/connections.router";
import { ConnectionsController } from "@/modules/connection/connections.controller";
import { ConnectionsService } from "@/modules/connection/connections.service";
import { ConnectionsRepository } from "@/modules/connection/connections.repository";

import { NotificationsRouter } from "@/modules/notification/notifications.router";
import { NotificationsRepository } from "@/modules/notification/notifications.repository";
import { NotificationsService } from "@/modules/notification/notifications.service";
import { NotificationsController } from "@/modules/notification/notifications.controller";

import { Server as SocketServer } from "socket.io";
import { SocketServerProvider } from "@/web-socket/socket-server.provider";
import { WebSocketServer } from "@/web-socket/web-socket.server";
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
container.bind<AuthRouter>(TYPES.AuthRouter).to(AuthRouter);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container.bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository);

container.bind<UsersRouter>(TYPES.UsersRouter).to(UsersRouter);
container.bind<UsersController>(TYPES.UsersController).to(UsersController);
container.bind<UsersService>(TYPES.UsersService).to(UsersService);
container.bind<UsersRepository>(TYPES.UsersRepository).to(UsersRepository);

container.bind<ChannelsRouter>(TYPES.ChannelsRouter).to(ChannelsRouter);
container.bind<ChannelsController>(TYPES.ChannelsController).to(ChannelsController);
container.bind<ChannelsService>(TYPES.ChannelsService).to(ChannelsService);
container.bind<ChannelsRepository>(TYPES.ChannelsRepository).to(ChannelsRepository);

container.bind<MessagesRouter>(TYPES.MessagesRouter).to(MessagesRouter);
container.bind<MessagesController>(TYPES.MessagesController).to(MessagesController);
container.bind<MessagesService>(TYPES.MessagesService).to(MessagesService);
container.bind<MessagesRepository>(TYPES.MessagesRepository).to(MessagesRepository);

container.bind<MessageReceiptsService>(TYPES.MessageReceiptsService).to(MessageReceiptsService);
container.bind<MessageReceiptsRepository>(TYPES.MessageReceiptsRepository).to(MessageReceiptsRepository);

container.bind<ConnectionsRouter>(TYPES.ConnectionsRouter).to(ConnectionsRouter);
container.bind<ConnectionsController>(TYPES.ConnectionsController).to(ConnectionsController);
container.bind<ConnectionsService>(TYPES.ConnectionsService).to(ConnectionsService);
container.bind<ConnectionsRepository>(TYPES.ConnectionsRepository).to(ConnectionsRepository);

container.bind<NotificationsRouter>(TYPES.NotificationsRouter).to(NotificationsRouter);
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
container.bind<WebSocketServer>(TYPES.WebSocketServer).to(WebSocketServer);

export { container };
