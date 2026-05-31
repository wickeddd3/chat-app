import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";

import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/prisma/client";
import { redisClient } from "@/lib/redis";

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
import { PresenceService } from "@/web-socket/services/presence.service";


const container = new Container();

// Bind Prisma Client as a structural constant value singleton
container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind(TYPES.RedisClient).toConstantValue(redisClient);

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

export { container };
