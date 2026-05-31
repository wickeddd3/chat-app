export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),

  UsersController: Symbol.for("UsersController"),
  UsersService: Symbol.for("UsersService"),
  UsersRepository: Symbol.for("UsersRepository"),

  ChannelsController: Symbol.for("ChannelsController"),
  ChannelsService: Symbol.for("ChannelsService"),
  ChannelsRepository: Symbol.for("ChannelsRepository"),

  MessagesController: Symbol.for("MessagesController"),
  MessagesService: Symbol.for("MessagesService"),
  MessagesRepository: Symbol.for("MessagesRepository"),

  ConnectionsController: Symbol.for("ConnectionsController"),
  ConnectionsService: Symbol.for("ConnectionsService"),
  ConnectionsRepository: Symbol.for("ConnectionsRepository"),

  NotificationsController: Symbol.for("NotificationsController"),
  NotificationsService: Symbol.for("NotificationsService"),
  NotificationsRepository: Symbol.for("NotificationsRepository"),
};
